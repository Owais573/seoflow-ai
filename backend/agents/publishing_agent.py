import os
import httpx
from workflows.state import WorkflowState
import base64
import markdown

async def publishing_node(state: WorkflowState) -> dict:
    draft_content = state.get("draft_content", "")
    seo_metadata = state.get("seo_metadata", {})
    title = seo_metadata.get("title", state.get("topic", "Draft Title"))
    media_id = state.get("media_id")
    
    # Remove leading H1 title to prevent duplicate titles in WordPress
    draft_content_clean = draft_content.strip()
    if draft_content_clean.startswith("# "):
        # split by newline and remove the first line
        lines = draft_content_clean.split('\n')
        draft_content_clean = '\n'.join(lines[1:]).strip()
    
    # Convert Markdown to HTML
    html_content = markdown.markdown(draft_content_clean)
    
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
    
    try:
        async with httpx.AsyncClient() as client:
            # 1. Check or Create Category "AI Articles"
            cat_id = None
            cat_search_url = f"{wp_url.rstrip('/')}/wp-json/wp/v2/categories?search=AI Articles"
            cat_resp = await client.get(cat_search_url, headers=headers)
            if cat_resp.status_code == 200 and len(cat_resp.json()) > 0:
                cat_id = cat_resp.json()[0]['id']
            else:
                cat_create_url = f"{wp_url.rstrip('/')}/wp-json/wp/v2/categories"
                cat_create_resp = await client.post(cat_create_url, json={"name": "AI Articles"}, headers=headers)
                if cat_create_resp.status_code in [200, 201]:
                    cat_id = cat_create_resp.json()['id']
                    
            # 2. Publish Post
            data = {
                "title": title,
                "content": html_content,
                "status": "publish",
            }
            if cat_id:
                data["categories"] = [cat_id]
            if media_id:
                data["featured_media"] = media_id
                
            response = await client.post(endpoint, json=data, headers=headers)
            if response.status_code in [200, 201]:
                post_data = response.json()
                return {
                    "current_step": f"Published to WP (ID: {post_data.get('id')})",
                    "progress": 100,
                    "status": "PUBLISHED",
                    "published_url": post_data.get("link")
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
