import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from workflows.state import WorkflowState

llm = ChatOpenAI(model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"), api_key=os.getenv("OPENAI_API_KEY"))

async def seo_node(state: WorkflowState) -> dict:
    draft_content = state.get("draft_content")
    primary_keyword = state.get("primary_keyword")
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert SEO Optimizer. Given a draft article, extract or generate the optimal SEO Title and Meta Description."),
        ("user", f"Keyword: {primary_keyword}\n\nArticle:\n{draft_content}\n\nPlease provide the SEO metadata.")
    ])
    
    chain = prompt | llm.with_structured_output(schema={
        "title": "SEOMetadata",
        "type": "object",
        "properties": {
            "seo_title": {"type": "string"},
            "meta_description": {"type": "string"}
        },
        "required": ["seo_title", "meta_description"]
    })
    
    result = await chain.ainvoke({})
    
    return {
        "seo_metadata": {
            "title": result["seo_title"],
            "description": result["meta_description"]
        },
        "current_step": "SEO optimization complete",
        "progress": 80,
        "status": "MEDIA_PROMPT"
    }
