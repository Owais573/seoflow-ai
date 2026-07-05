import asyncio
import json
from datetime import datetime, timezone
from collections import defaultdict
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sse_starlette.sse import EventSourceResponse

from database.session import get_db, get_db_context
from database.models import Workflow, WorkflowLog, WorkflowStatus

router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])

@router.get("/stats")
async def get_monitoring_stats(db: AsyncSession = Depends(get_db)):
    # 1. Throughput
    wf_result = await db.execute(select(Workflow))
    workflows = wf_result.scalars().all()
    
    throughput = {
        "active": 0,
        "completed": 0,
        "failed": 0,
        "pending_review": 0,
        "total": len(workflows)
    }
    for wf in workflows:
        if wf.status == WorkflowStatus.PUBLISHED:
            throughput["completed"] += 1
        elif wf.status == WorkflowStatus.FAILED:
            throughput["failed"] += 1
        elif wf.status == WorkflowStatus.PENDING_REVIEW:
            throughput["pending_review"] += 1
        else:
            throughput["active"] += 1

    # 2. Token & Latency Aggregation
    log_result = await db.execute(select(WorkflowLog).order_by(WorkflowLog.timestamp.asc()))
    logs = log_result.scalars().all()

    tokens = {"prompt": 0, "completion": 0}
    agent_stats = defaultdict(lambda: {
        "prompt_tokens": 0, 
        "completion_tokens": 0, 
        "latencies": []
    })
    
    # Track min/max timestamp per agent per workflow
    # Structure: wf_agent_times[workflow_id][agent] = {"start": dt, "end": dt}
    wf_agent_times = defaultdict(lambda: defaultdict(dict))

    for log in logs:
        # Tokens
        if log.details:
            pt = log.details.get("prompt_tokens", 0)
            ct = log.details.get("completion_tokens", 0)
            tokens["prompt"] += pt
            tokens["completion"] += ct
            agent_stats[log.agent]["prompt_tokens"] += pt
            agent_stats[log.agent]["completion_tokens"] += ct
            
        # Latency tracking
        if log.agent not in ["System", "Human"]: # Ignore system/human events for agent latency
            if "start" not in wf_agent_times[log.workflow_id][log.agent]:
                wf_agent_times[log.workflow_id][log.agent]["start"] = log.timestamp
            wf_agent_times[log.workflow_id][log.agent]["end"] = log.timestamp

    # Compute latencies
    for wf_id, agents in wf_agent_times.items():
        for agent, times in agents.items():
            if "start" in times and "end" in times:
                delta = (times["end"] - times["start"]).total_seconds()
                agent_stats[agent]["latencies"].append(delta)

    # Calculate system latency (average workflow total execution time)
    wf_latencies = []
    for wf_id, agents in wf_agent_times.items():
        wf_total_time = 0
        for agent, times in agents.items():
            if "start" in times and "end" in times:
                wf_total_time += (times["end"] - times["start"]).total_seconds()
        if wf_total_time > 0:
            wf_latencies.append(wf_total_time)

    avg_system_latency = sum(wf_latencies) / len(wf_latencies) if wf_latencies else 0

    # Format agent stats for frontend
    formatted_agents = []
    for agent, stats in agent_stats.items():
        if agent in ["System", "Human"]: continue
        lats = stats["latencies"]
        avg_latency = sum(lats) / len(lats) if lats else 0
        max_latency = max(lats) if lats else 0
        formatted_agents.append({
            "name": agent,
            "avg_latency": round(avg_latency, 2),
            "max_latency": round(max_latency, 2),
            "prompt_tokens": stats["prompt_tokens"],
            "completion_tokens": stats["completion_tokens"]
        })

    return {
        "throughput": throughput,
        "tokens": tokens,
        "avg_system_latency": round(avg_system_latency, 2),
        "agents": formatted_agents
    }

@router.get("/stream")
async def global_log_stream():
    async def event_generator():
        last_log_id = 0
        while True:
            async with get_db_context() as local_db:
                # Fetch new logs globally
                logs_query = await local_db.execute(
                    select(WorkflowLog)
                    .where(WorkflowLog.id > last_log_id)
                    .order_by(WorkflowLog.id.asc())
                )
                new_logs = logs_query.scalars().all()
                for log in new_logs:
                    log_data = {
                        "id": log.id,
                        "workflow_id": log.workflow_id,
                        "agent": log.agent,
                        "action": log.action,
                        "timestamp": log.timestamp.isoformat()
                    }
                    yield {
                        "event": "log",
                        "data": json.dumps(log_data)
                    }
                    last_log_id = log.id

            await asyncio.sleep(2)
            
    return EventSourceResponse(event_generator())
