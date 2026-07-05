from typing import TypedDict, Annotated, List, Dict, Any, Optional

# This defines the shared state for the LangGraph workflow
class WorkflowState(TypedDict):
    workflow_id: int
    brief_id: int
    topic: str
    primary_keyword: str
    secondary_keywords: Optional[str]
    
    # Outputs from agents
    research_data: Optional[Dict[str, Any]]
    outline: Optional[List[str]]
    draft_content: Optional[str]
    seo_metadata: Optional[Dict[str, str]]
    media_prompt: Optional[str]
    
    # Internal state tracking
    current_step: str
    progress: int
    status: str
    
    # Error handling
    errors: Optional[List[str]]
