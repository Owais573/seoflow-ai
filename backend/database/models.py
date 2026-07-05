from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, Enum
from sqlalchemy.orm import declarative_base
import enum
from datetime import datetime

Base = declarative_base()

class WorkflowStatus(enum.Enum):
    CREATED = "CREATED"
    RESEARCH = "RESEARCH"
    CONTENT_PLANNING = "CONTENT_PLANNING"
    CONTENT_GENERATION = "CONTENT_GENERATION"
    SEO_OPTIMIZATION = "SEO_OPTIMIZATION"
    MEDIA_PROMPT = "MEDIA_PROMPT"
    PENDING_REVIEW = "PENDING_REVIEW"
    PUBLISHED = "PUBLISHED"
    FAILED = "FAILED"

class ContentBrief(Base):
    __tablename__ = "content_briefs"
    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, nullable=False)
    primary_keyword = Column(String, nullable=False)
    secondary_keywords = Column(Text, nullable=True) # comma separated or JSON
    tone = Column(String, nullable=True)
    audience = Column(String, nullable=True)
    length = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Workflow(Base):
    __tablename__ = "workflows"
    id = Column(Integer, primary_key=True, index=True)
    brief_id = Column(Integer, ForeignKey("content_briefs.id"), nullable=False)
    status = Column(Enum(WorkflowStatus), default=WorkflowStatus.CREATED)
    current_step = Column(String, nullable=True)
    progress = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class WorkflowLog(Base):
    __tablename__ = "workflow_logs"
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    agent = Column(String, nullable=False)
    action = Column(String, nullable=False)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class ContentDraft(Base):
    __tablename__ = "content_drafts"
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    title = Column(String, nullable=True)
    content = Column(Text, nullable=True)
    meta_description = Column(String, nullable=True)
    schema_markup = Column(JSON, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MediaPrompt(Base):
    __tablename__ = "media_prompts"
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    image_prompt = Column(Text, nullable=False)
    alt_text = Column(String, nullable=True)
    caption = Column(String, nullable=True)

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    status = Column(String, nullable=False) # APPROVED, REJECTED
    comments = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, default=datetime.utcnow)

class PublishedArticle(Base):
    __tablename__ = "published_articles"
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    url = Column(String, nullable=False)
    wordpress_id = Column(String, nullable=True)
    published_at = Column(DateTime, default=datetime.utcnow)
