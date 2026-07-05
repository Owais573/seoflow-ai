import httpx
import os
import asyncio
import logging

logger = logging.getLogger(__name__)

async def send_n8n_webhook(event: str, workflow_id: int, topic: str):
    """
    Sends an async HTTP POST to the n8n webhook URL without blocking.
    """
    webhook_url = os.getenv("N8N_WEBHOOK_URL")
    if not webhook_url:
        logger.warning(f"N8N_WEBHOOK_URL not configured. Skipping {event} notification for Workflow #{workflow_id}.")
        return

    payload = {
        "event": event,
        "workflow_id": workflow_id,
        "topic": topic,
        "dashboard_url": f"http://localhost:3000/workflows/{workflow_id}"
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(webhook_url, json=payload)
            if response.status_code >= 400:
                logger.error(f"Failed to send n8n webhook: {response.text}")
            else:
                logger.info(f"Successfully triggered n8n webhook for event: {event}")
    except Exception as e:
        logger.error(f"Error triggering n8n webhook: {str(e)}")
