import os
import httpx
from workflows.state import WorkflowState
import base64

async def publishing_node(state: WorkflowState) -> dict:
    draft_content = state.get("draft_content", "")
    seo_metadata = state.get("seo_metadata", {})
    title = seo_metadata.get("title", state.get("topic", "Draft Title"))
    
    wp_url = os.getenv("WP_URL")
    wp_username = os.getenv("WP_USERNAME")
    wp_app_password = os.getenv("WP_APP_PASSWORD")

    # If WP is not configured yet, we simulate publishing
    if not wp_url or not wp_app_password or wp_app_password == "your_app_password_here":
        return {
            "current_step": "Published (Simulated - no WP credentials)",
            "progress": 100,
            "status": "PUBLISHED"
        }

    # Prepare Basic Auth header
    credentials = f"{wp_username}:{wp_app_password}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode("utf-8")
    headers = {
        "Authorization": f"Basic {encoded_credentials}",
        "Content-Type": "application/json",
    }
    
    # WordPress REST API endpoint for posts
    endpoint = f"{wp_url.rstrip('/')}/wp-json/wp/v2/posts"
    
    data = {
        "title": title,
        "content": draft_content,
        "status": "draft", # Change to "publish" to automatically publish
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, json=data, headers=headers)
            if response.status_code in [200, 201]:
                post_data = response.json()
                return {
                    "current_step": f"Published to WP (ID: {post_data.get('id')})",
                    "progress": 100,
                    "status": "PUBLISHED"
                }
            else:
                return {
                    "current_step": f"Failed to publish: {response.text}",
                    "progress": 95,
                    "status": "FAILED",
                    "errors": [f"WP Error: {response.text}"]
                }
    except Exception as e:
        return {
            "current_step": f"Exception during publishing: {str(e)}",
            "progress": 95,
            "status": "FAILED",
            "errors": [str(e)]
        }
