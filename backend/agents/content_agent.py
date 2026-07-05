import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from workflows.state import WorkflowState

llm = ChatOpenAI(model="gpt-4o-mini", api_key=os.getenv("OPENAI_API_KEY"))

async def content_node(state: WorkflowState) -> dict:
    topic = state.get("topic")
    outline = state.get("outline", [])
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert Content Writer. Write a high-quality, engaging article based on the provided topic and outline. Use Markdown formatting."),
        ("user", f"Topic: {topic}\nOutline:\n" + "\n".join(f"- {o}" for o in outline) + "\n\nPlease write the full article now.")
    ])
    
    chain = prompt | llm | StrOutputParser()
    
    result = await chain.ainvoke({})
    
    return {
        "draft_content": result,
        "current_step": "Content generation complete",
        "progress": 60,
        "status": "SEO_OPTIMIZATION"
    }
