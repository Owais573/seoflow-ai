import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from workflows.state import WorkflowState
from database.session import log_workflow_event

llm = ChatOpenAI(model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"), api_key=os.getenv("OPENAI_API_KEY"))

async def research_node(state: WorkflowState) -> dict:
    topic = state.get("topic")
    primary_keyword = state.get("primary_keyword")
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert SEO Researcher. Generate a comprehensive research report including Search Intent, Competitor outline ideas, and a structured Content Outline."),
        ("user", f"Topic: {topic}\nPrimary Keyword: {primary_keyword}\n\nPlease output a structured JSON with 'search_intent', 'related_keywords' (list), and 'outline' (list of section headings).")
    ])
    
    chain = prompt | llm.with_structured_output(schema={
        "title": "ResearchReport",
        "type": "object",
        "properties": {
            "search_intent": {"type": "string"},
            "related_keywords": {"type": "array", "items": {"type": "string"}},
            "outline": {"type": "array", "items": {"type": "string"}}
        },
        "required": ["search_intent", "related_keywords", "outline"]
    }, include_raw=True)
    
    await log_workflow_event(state["workflow_id"], "Research Agent", "Initiated web scraping and search intent analysis...")
    result_raw = await chain.ainvoke({})
    result = result_raw["parsed"]
    usage = result_raw["raw"].usage_metadata or {}
    prompt_tokens = usage.get("input_tokens", 0)
    completion_tokens = usage.get("output_tokens", 0)
    await log_workflow_event(
        state["workflow_id"], 
        "Research Agent", 
        f"Compiled research report. Identified {len(result['related_keywords'])} LSI keywords and {len(result['outline'])} outline sections. [Tokens: ↑{prompt_tokens} | ↓{completion_tokens}]",
        details={"prompt_tokens": prompt_tokens, "completion_tokens": completion_tokens}
    )
    
    return {
        "research_data": {
            "search_intent": result["search_intent"],
            "related_keywords": result["related_keywords"]
        },
        "outline": result["outline"],
        "current_step": "Research complete",
        "progress": 30,
        "status": "CONTENT_PLANNING"
    }
