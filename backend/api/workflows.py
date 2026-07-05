import asyncio
import os
import base64
import httpx
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from typing import List

from database.session import get_db, get_db_context
from database.models import ContentBrief, Workflow, WorkflowStatus
from schemas.briefs import ContentBriefCreate, ContentBriefResponse
from schemas.workflows import WorkflowResponse, WorkflowDetailResponse, ApprovalRequest
from core.notifications import send_n8n_webhook


from sse_starlette.sse import EventSourceResponse

router = APIRouter(prefix="/api/workflows", tags=["workflows"])

@router.post("/", response_model=WorkflowResponse)
async def create_workflow(brief_in: ContentBriefCreate, db: AsyncSession = Depends(get_db)):
    # 1. Create Content Brief
    new_brief = ContentBrief(**brief_in.model_dump())
    db.add(new_brief)
    await db.commit()
    await db.refresh(new_brief)

    # 2. Create Workflow
    new_workflow = Workflow(brief_id=new_brief.id, status=WorkflowStatus.CREATED)
    db.add(new_workflow)
    await db.commit()
    await db.refresh(new_workflow)
    
    return new_workflow

@router.get("/", response_model=List[WorkflowResponse])
async def list_workflows(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workflow).order_by(Workflow.created_at.desc()))
    workflows = result.scalars().all()
    return workflows

@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(workflow_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow

@router.get("/{workflow_id}/state")
async def get_workflow_state(workflow_id: int):
    from workflows.graph import graph
    config = {"configurable": {"thread_id": str(workflow_id)}}
    state = await graph.aget_state(config)
    if not state or not state.values:
        return {
            "draft_content": "Memory state was lost (likely due to server reload). Please create a new workflow.",
            "seo_metadata": {"title": "State Lost", "description": "State Lost"},
            "media_prompt": "State Lost"
        }
    return state.values

@router.get("/{workflow_id}/logs")
async def get_workflow_logs(workflow_id: int, db: AsyncSession = Depends(get_db)):
    from database.models import WorkflowLog
    result = await db.execute(
        select(WorkflowLog)
        .where(WorkflowLog.workflow_id == workflow_id)
        .order_by(WorkflowLog.id.asc())
    )
    logs = result.scalars().all()
    return [{"id": l.id, "agent": l.agent, "action": l.action, "timestamp": l.timestamp.isoformat()} for l in logs]

@router.post("/{workflow_id}/upload-image")
async def upload_image(workflow_id: int, file: UploadFile = File(...)):
    content = await file.read()
    
    wp_url = os.getenv("WP_URL")
    wp_username = os.getenv("WP_USERNAME")
    wp_app_password = os.getenv("WP_APP_PASSWORD")

    if not wp_url or not wp_app_password:
        raise HTTPException(status_code=400, detail="WordPress credentials not configured")

    credentials = f"{wp_username}:{wp_app_password}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode("utf-8")
    headers = {
        "Authorization": f"Basic {encoded_credentials}",
        "Content-Type": file.content_type,
        "Content-Disposition": f'attachment; filename="{file.filename}"'
    }
    
    endpoint = f"{wp_url.rstrip('/')}/wp-json/wp/v2/media"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, content=content, headers=headers)
            if response.status_code in [200, 201]:
                media_data = response.json()
                return {"media_id": media_data.get("id")}
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: int, db: AsyncSession = Depends(get_db)):
    print(f"[Workflow {workflow_id}] Initiating deletion process...")
    workflow = await get_workflow(workflow_id, db)
    brief_id = workflow.brief_id
    
    from database.models import WorkflowLog, ContentDraft, MediaPrompt, Review, PublishedArticle
    
    # Cascade delete all dependent records first
    await db.execute(delete(WorkflowLog).where(WorkflowLog.workflow_id == workflow_id))
    await db.execute(delete(ContentDraft).where(ContentDraft.workflow_id == workflow_id))
    await db.execute(delete(MediaPrompt).where(MediaPrompt.workflow_id == workflow_id))
    await db.execute(delete(Review).where(Review.workflow_id == workflow_id))
    await db.execute(delete(PublishedArticle).where(PublishedArticle.workflow_id == workflow_id))
    print(f"[Workflow {workflow_id}] Deleted dependent records from database.")
    
    # Delete workflow
    await db.execute(delete(Workflow).where(Workflow.id == workflow_id))
    print(f"[Workflow {workflow_id}] Deleted Workflow record from database.")
    
    # Delete associated brief
    await db.execute(delete(ContentBrief).where(ContentBrief.id == brief_id))
    print(f"[Workflow {workflow_id}] Deleted associated ContentBrief (ID: {brief_id}) from database.")
    
    await db.commit()
    print(f"[Workflow {workflow_id}] Deletion committed successfully.")
    
    return {"status": "deleted", "workflow_id": workflow_id}

@router.post("/{workflow_id}/start")
async def start_workflow(workflow_id: int, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    workflow = await get_workflow(workflow_id, db)
    workflow.status = WorkflowStatus.RESEARCH
    workflow.current_step = "Starting research phase..."
    workflow.progress = 10
    await db.commit()
    
    # Trigger LangGraph execution in background
    from workflows.graph import graph
    async def run_graph():
        config = {"configurable": {"thread_id": str(workflow_id)}}
        # Need to fetch the brief topic and keyword
        async with get_db_context() as local_db:
            res = await local_db.execute(select(ContentBrief).where(ContentBrief.id == workflow.brief_id))
            brief = res.scalar_one_or_none()
            
            initial_state = {
                "workflow_id": workflow_id,
                "brief_id": workflow.brief_id,
                "topic": brief.topic,
                "primary_keyword": brief.primary_keyword,
                "current_step": "Starting research phase...",
                "progress": 10,
                "status": "RESEARCH"
            }
            # We will use astream to capture intermediate state updates
            print(f"[Workflow {workflow_id}] Starting AI agents...")
            async for event in graph.astream(initial_state, config, stream_mode="values"):
                print(f"[Workflow {workflow_id}] Agent finished. step='{event.get('current_step')}', progress={event.get('progress')}%")
                # Update DB with latest state
                wf_res = await local_db.execute(select(Workflow).where(Workflow.id == workflow_id))
                wf = wf_res.scalar_one_or_none()
                if wf:
                    if "status" in event and event["status"] in [s.value for s in WorkflowStatus]:
                        wf.status = WorkflowStatus(event["status"])
                        if wf.status == WorkflowStatus.PENDING_REVIEW:
                            asyncio.create_task(send_n8n_webhook("human_review_required", workflow_id, brief.topic))
                    if "current_step" in event:
                        wf.current_step = event["current_step"]
                    if "progress" in event:
                        wf.progress = event["progress"]
                    await local_db.commit()

    background_tasks.add_task(run_graph)
    
    return {"status": "started", "workflow_id": workflow_id}

@router.get("/{workflow_id}/stream")
async def stream_workflow_progress(workflow_id: int, db: AsyncSession = Depends(get_db)):
    async def event_generator():
        from database.models import WorkflowLog
        import json
        previous_progress = -1
        last_log_id = 0
        while True:
            # Re-fetch the workflow in a fresh session to avoid stale SQLAlchemy caching
            async with get_db_context() as local_db:
                result = await local_db.execute(select(Workflow).where(Workflow.id == workflow_id))
                workflow = result.scalar_one_or_none()
                if not workflow:
                    yield {"event": "error", "data": "Workflow not found"}
                    break
                    
                # Fetch new logs
                logs_query = await local_db.execute(
                    select(WorkflowLog)
                    .where(WorkflowLog.workflow_id == workflow_id, WorkflowLog.id > last_log_id)
                    .order_by(WorkflowLog.id.asc())
                )
                new_logs = logs_query.scalars().all()
                for log in new_logs:
                    log_data = {
                        "id": log.id,
                        "agent": log.agent,
                        "action": log.action,
                        "timestamp": log.timestamp.isoformat()
                    }
                    yield {
                        "event": "log",
                        "data": json.dumps(log_data)
                    }
                    last_log_id = log.id

                if workflow.progress != previous_progress:
                    yield {
                        "event": "message",
                        "data": f'{{"progress": {workflow.progress}, "status": "{workflow.status.value}", "current_step": "{workflow.current_step}"}}'
                    }
                    previous_progress = workflow.progress
                    
                if workflow.status in [WorkflowStatus.PENDING_REVIEW, WorkflowStatus.FAILED] or (workflow.status == WorkflowStatus.PUBLISHED and workflow.progress == 100):
                    break
                    
            await asyncio.sleep(2) # Poll every 2 seconds
            
    return EventSourceResponse(event_generator())

@router.post("/{workflow_id}/approve")
async def approve_workflow(workflow_id: int, approval: ApprovalRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    workflow = await get_workflow(workflow_id, db)
    if workflow.status != WorkflowStatus.PENDING_REVIEW:
        raise HTTPException(status_code=400, detail="Workflow is not pending review")
        
    workflow.status = WorkflowStatus.PUBLISHED # Temporarily set to PUBLISHING essentially
    workflow.current_step = "Publishing to WordPress..."
    workflow.progress = 95
    await db.commit()
    
    from workflows.graph import graph
    
    async def resume_graph():
        config = {"configurable": {"thread_id": str(workflow_id)}}
        
        # 1. Update state with human edits
        updates = {}
        if approval.content:
            updates["draft_content"] = approval.content
        if approval.title or approval.meta_description:
            updates["seo_metadata"] = {
                "title": approval.title,
                "description": approval.meta_description
            }
        if approval.media_prompt:
            updates["media_prompt"] = approval.media_prompt
        if approval.media_id:
            updates["media_id"] = approval.media_id
            
        if updates:
            graph.update_state(config, updates)
            
        # 2. Resume graph execution (this will run the publishing_node)
        final_state = await graph.ainvoke(None, config)
        
        # 3. Update DB with final state
        async with get_db_context() as local_db:
            wf_res = await local_db.execute(select(Workflow).where(Workflow.id == workflow_id))
            wf = wf_res.scalar_one_or_none()
            if final_state.get("status") == "PUBLISHED":
                wf.status = WorkflowStatus.PUBLISHED
                
                post_url = final_state.get("published_url")
                if post_url:
                    from database.models import PublishedArticle
                    new_article = PublishedArticle(workflow_id=workflow_id, url=post_url)
                    local_db.add(new_article)

                # Fetch brief for webhook
                b_res = await local_db.execute(select(ContentBrief).where(ContentBrief.id == wf.brief_id))
                b_row = b_res.scalar_one_or_none()
                if b_row:
                    asyncio.create_task(send_n8n_webhook("published", workflow_id, b_row.topic, post_url=post_url))
            else:
                wf.status = WorkflowStatus.FAILED
            wf.current_step = final_state.get("current_step", "Finished")
            wf.progress = final_state.get("progress", 100)
            await local_db.commit()

    background_tasks.add_task(resume_graph)
    
    return {"status": "publishing", "workflow_id": workflow_id}
