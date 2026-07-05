import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from workflows.state import WorkflowState
from database.session import log_workflow_event

llm = ChatOpenAI(model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"), api_key=os.getenv("OPENAI_API_KEY"))

async def content_node(state: WorkflowState) -> dict:
    topic = state.get("topic")
    outline = state.get("outline", [])
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert Content Writer. Write a high-quality, engaging article based on the provided topic and outline. Use Markdown formatting."),
        ("user", f"Topic: {topic}\nOutline:\n" + "\n".join(f"- {o}" for o in outline) + "\n\nPlease write the full article now.")
    ])
    
    chain = prompt | llm
    
    await log_workflow_event(state["workflow_id"], "Content Agent", "Drafting long-form article based on approved outline and search intent...")
    result_raw = await chain.ainvoke({})
    result = result_raw.content
    usage = result_raw.usage_metadata or {}
    prompt_tokens = usage.get("input_tokens", 0)
    completion_tokens = usage.get("output_tokens", 0)
    await log_workflow_event(state["workflow_id"], "Content Agent", f"Generated Markdown draft. Total length: {len(result)} characters. [Tokens: ↑{prompt_tokens} | ↓{completion_tokens}]")
    
    return {
        "draft_content": result,
        "current_step": "Content generation complete",
        "progress": 60,
        "status": "SEO_OPTIMIZATION"
    }
