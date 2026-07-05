from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from workflows.state import WorkflowState
from agents.research_agent import research_node
from agents.content_agent import content_node
from agents.seo_agent import seo_node
from agents.media_agent import media_node
from agents.publishing_agent import publishing_node

# Build the graph
builder = StateGraph(WorkflowState)

# Add nodes
builder.add_node("research", research_node)
builder.add_node("content_planning", content_node)
builder.add_node("seo_optimization", seo_node)
builder.add_node("media_prompt", media_node)
builder.add_node("publishing", publishing_node)

# Set entry point
builder.set_entry_point("research")

# Add edges
builder.add_edge("research", "content_planning")
builder.add_edge("content_planning", "seo_optimization")
builder.add_edge("seo_optimization", "media_prompt")
builder.add_edge("media_prompt", "publishing")

# Compile graph with memory saver and interrupt before publishing
memory = MemorySaver()
graph = builder.compile(checkpointer=memory, interrupt_before=["publishing"])
