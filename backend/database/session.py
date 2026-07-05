import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://seoflow_user:seoflow_password@localhost/seoflow_db")

engine = create_async_engine(DATABASE_URL, echo=False)

async_session_maker = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_db():
    async with async_session_maker() as session:
        yield session

from contextlib import asynccontextmanager

@asynccontextmanager
async def get_db_context():
    async with async_session_maker() as session:
        yield session

async def log_workflow_event(workflow_id: int, agent: str, action: str, details: dict = None):
    from database.models import WorkflowLog
    async with get_db_context() as db:
        log = WorkflowLog(
            workflow_id=workflow_id,
            agent=agent,
            action=action,
            details=details
        )
        db.add(log)
        await db.commit()
