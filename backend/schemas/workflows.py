from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime
from database.models import WorkflowStatus
from schemas.briefs import ContentBriefResponse

class WorkflowResponse(BaseModel):
    id: int
    brief_id: int
    status: WorkflowStatus
    current_step: Optional[str] = None
    progress: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class WorkflowDetailResponse(WorkflowResponse):
    brief: ContentBriefResponse

    class Config:
        from_attributes = True
        
class ApprovalRequest(BaseModel):
    title: Optional[str] = None
    meta_description: Optional[str] = None
    content: Optional[str] = None
    media_prompt: Optional[str] = None
    media_id: Optional[int] = None
