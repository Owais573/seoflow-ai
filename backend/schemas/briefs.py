from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ContentBriefCreate(BaseModel):
    topic: str
    primary_keyword: str
    secondary_keywords: Optional[str] = None
    tone: Optional[str] = None
    audience: Optional[str] = None
    length: Optional[str] = None

class ContentBriefResponse(ContentBriefCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
