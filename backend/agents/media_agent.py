import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from workflows.state import WorkflowState
from database.session import log_workflow_event
import httpx

llm = ChatOpenAI(model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"), api_key=os.getenv("OPENAI_API_KEY"))

async def trigger_n8n_webhook(workflow_id: int, topic: str):
    webhook_url = os.getenv("N8N_WEBHOOK_URL")
    if not webhook_url:
        return
    try:
        async with httpx.AsyncClient() as client:
            await client.post(webhook_url, json={
                "workflow_id": workflow_id,
                "topic": topic,
                "message": f"Article for '{topic}' is ready for review."
            })
    except Exception as e:
        print(f"Error triggering n8n webhook: {e}")

async def media_node(state: WorkflowState) -> dict:
    topic = state.get("topic")
    draft_content = state.get("draft_content", "")[:1000] # First 1000 chars for context
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert Prompt Engineer for Midjourney/DALL-E. Generate a highly descriptive image generation prompt for a featured image of a blog post."),
        ("user", f"Topic: {topic}\nArticle Snippet: {draft_content}\n\nPlease generate ONLY the image prompt string.")
    ])
    
    chain = prompt | llm
    
    await log_workflow_event(state["workflow_id"], "Media Agent", "Formulating precise generative AI prompt for featured image creation...")
    result_raw = await chain.ainvoke({})
    result = result_raw.content
    usage = result_raw.usage_metadata or {}
    prompt_tokens = usage.get("input_tokens", 0)
    completion_tokens = usage.get("output_tokens", 0)
    await log_workflow_event(
        state["workflow_id"], 
        "Media Agent", 
        f"Image prompt generated. Prompt length: {len(result)} characters. [Tokens: ↑{prompt_tokens} | ↓{completion_tokens}]",
        details={"prompt_tokens": prompt_tokens, "completion_tokens": completion_tokens}
    )
    
    # Trigger webhook to notify human that workflow is waiting for review
    await trigger_n8n_webhook(state.get("workflow_id"), topic)
    await log_workflow_event(state["workflow_id"], "System", "Workflow paused. Triggering webhook alert for human review.")
    
    return {
        "media_prompt": result,
        "current_step": "Waiting for Human Review",
        "progress": 90,
        "status": "PENDING_REVIEW"
    }
