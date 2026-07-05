import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from database.session import get_db, get_db_context
from database.models import ContentBrief, Workflow, WorkflowStatus
from schemas.briefs import ContentBriefCreate, ContentBriefResponse
from schemas.workflows import WorkflowResponse, WorkflowDetailResponse, ApprovalRequest

# ... (down below)


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
            # We would capture updates from astream_events to write to DB,
            # but for MVP we will let the nodes update state, and then we will update DB at the end
            # Actually, we can update DB right here after graph finishes.
            final_state = await graph.ainvoke(initial_state, config)
            
            # Update DB with final_state
            wf_res = await local_db.execute(select(Workflow).where(Workflow.id == workflow_id))
            wf = wf_res.scalar_one_or_none()
            wf.status = WorkflowStatus.PENDING_REVIEW
            wf.current_step = "Waiting for Human Review"
            wf.progress = 90
            await local_db.commit()

    background_tasks.add_task(run_graph)
    
    return {"status": "started", "workflow_id": workflow_id}

@router.get("/{workflow_id}/stream")
async def stream_workflow_progress(workflow_id: int, db: AsyncSession = Depends(get_db)):
    async def event_generator():
        # This is a placeholder SSE generator.
        # In a real app, this would listen to Redis/Postgres PUB/SUB or check database state periodically
        # or LangGraph's astream_events.
        previous_progress = -1
        while True:
            # Re-fetch the workflow
            result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
            workflow = result.scalar_one_or_none()
            if not workflow:
                yield {"event": "error", "data": "Workflow not found"}
                break
                
            if workflow.progress != previous_progress:
                yield {
                    "event": "message",
                    "data": f'{{"progress": {workflow.progress}, "status": "{workflow.status.value}", "current_step": "{workflow.current_step}"}}'
                }
                previous_progress = workflow.progress
                
            if workflow.status in [WorkflowStatus.PENDING_REVIEW, WorkflowStatus.PUBLISHED, WorkflowStatus.FAILED]:
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
            else:
                wf.status = WorkflowStatus.FAILED
            wf.current_step = final_state.get("current_step", "Finished")
            wf.progress = final_state.get("progress", 100)
            await local_db.commit()

    background_tasks.add_task(resume_graph)
    
    return {"status": "publishing", "workflow_id": workflow_id}
