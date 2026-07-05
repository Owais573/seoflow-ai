# SEOFlow AI 🚀
**An AI Operating System for Content Marketing**

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![n8n](https://img.shields.io/badge/n8n-FF6D5A?style=for-the-badge&logo=n8n&logoColor=white)
![WordPress](https://img.shields.io/badge/WordPress-21759B?style=for-the-badge&logo=wordpress&logoColor=white)

---

## 1. Overview & Architecture

**SEOFlow AI** is a fully automated, multi-agent platform designed to streamline your entire content marketing pipeline. By simply providing a Topic and a Primary Keyword, the system orchestrates a swarm of specialized AI agents to research, write, SEO-optimize, and seamlessly publish high-quality articles directly to your WordPress site.

### System Architecture Diagram

```mermaid
graph TD
    UI[Next.js Dashboard UI] -->|1. POST Brief| API[FastAPI Backend]
    UI -.->|2. SSE Real-Time Updates| API
    
    API -->|3. Trigger| LG[LangGraph Orchestrator]
    
    subgraph The AI Workforce
        LG --> A1[Research Agent]
        A1 --> A2[Content Agent]
        A2 --> A3[SEO Agent]
        A3 --> A4[Media Agent]
    end
    
    A4 -->|4. Webhook Notification| N8N[n8n Automation]
    N8N -->|Alert| SLACK[Slack/Discord]
    
    A4 -.->|Pause for Approval| API
    
    UI -->|5. Human Approve| API
    API -->|6. Resume Graph| A5[Publishing Agent]
    A5 -->|7. REST API Publish| WP[(WordPress)]
    
    LG <--> DB[(PostgreSQL)]
```

### The AI Workforce
The core engine is driven by **LangGraph**, routing tasks between specialized agents:
- **Research Agent**: Scrapes the web (or utilizes trained data) to determine search intent and build a structured outline.
- **Content Agent**: Drafts the long-form article using markdown, matching the required tone and audience.
- **SEO Agent**: Extracts and polishes the absolute best SEO Title and Meta Description for the drafted content.
- **Media Agent**: Crafts a highly descriptive image generation prompt (e.g., for Midjourney or DALL-E) to use as the featured image.
- **Publishing Agent**: Interfaces directly with the WordPress REST API to push the approved draft live.

---

## 2. Tech Stack Breakdown

### Frontend (User Interface)
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui

### Backend (API & Orchestration)
- **Framework**: FastAPI
- **Language**: Python 3.12 (managed via `uv`)
- **AI Orchestration**: LangGraph & LangChain Core
- **LLM**: OpenAI (`gpt-4.1-mini`)

### Database & Infrastructure
- **Database**: PostgreSQL (via Docker Compose)
- **ORM**: SQLAlchemy + asyncpg
- **Migrations**: Alembic

### Automation & CMS
- **Workflows**: n8n (Locally hosted via Docker)
- **CMS**: WordPress (Remote/Live hosted)

---

## 3. Local Setup Guide (A to Z)

Follow these steps to run SEOFlow AI locally on your machine.

### Prerequisites
- **Node.js** (v18+)
- **Python 3.12+** & **uv** package manager
- **Docker Desktop**
- **Git**

### Step 1: Clone the Repository
```bash
git clone https://github.com/Owais573/seoflow-ai.git
cd seoflow-ai
```

### Step 2: Environment Variables
Create the required `.env` files in both the `backend/` and `frontend/` directories (if applicable).

<details>
<summary><strong>View Backend <code>.env</code> Configuration</strong></summary>
Create a file named <code>.env</code> in the <code>backend/</code> folder:

```env
# Database Configuration
DATABASE_URL=postgresql+asyncpg://seoflow_user:seoflow_password@localhost/seoflow_db

# OpenAI API Key and Model
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4.1-mini

# n8n Webhook URL (For human-review notifications)
N8N_WEBHOOK_URL=http://localhost:5678/webhook/review-pending

# WordPress Credentials
WP_URL=https://your-wordpress-site.com
WP_USERNAME=your-email@example.com
WP_APP_PASSWORD=your-application-password
```
*Note: To generate a WP Application Password, go to WP Admin -> Users -> Profile -> Application Passwords.*
</details>

### Step 3: Start Infrastructure (Database & n8n)
We use Docker Compose to spin up PostgreSQL, Adminer (DB Viewer), and n8n.
```bash
cd infra
docker-compose up -d
```
*You can access Adminer at `http://localhost:8080` and n8n at `http://localhost:5678`.*

### Step 4: Backend Setup
The backend utilizes `uv` for blazing-fast dependency management. `uv run` will automatically create and use a `.venv` virtual environment.

```bash
cd backend
# Run Database Migrations
uv run alembic upgrade head

# Start the FastAPI Server
uv run uvicorn main:app --reload
```
*The API will be available at `http://localhost:8000`.*

### Step 5: Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*The UI will be available at `http://localhost:3000`.*

---

## 4. How to Use (User Guide)

1. **Create a Content Brief**: Open `http://localhost:3000` and click **New Content Brief**. Enter your desired Topic (e.g., "AI in Healthcare") and Primary Keyword.
2. **Watch the Magic**: Submit the form. You will be redirected to the Workflow Details page. Thanks to Server-Sent Events (SSE), you will see a progress bar move in real-time as the agents (Research -> Content -> SEO -> Media) do their work, alongside real-time backend terminal logs.
3. **Get Notified**: Once the Media Agent finishes, the workflow pauses. An alert is sent via the n8n webhook (which you can route to Slack/Discord).
4. **Human Review**: On the dashboard, the workflow will show **Action Required: Human Review**. The system automatically fetches the LangGraph state memory so you can directly read, review, and manually edit the generated SEO Title, Meta Description, Content Draft, and Image Prompt in a rich form UI.
5. **Publish**: Click **Approve & Publish**. The LangGraph workflow resumes, executing the Publishing Agent, which instantly pushes the article to your live WordPress site.
6. **Delete Workflow**: To clean up, simply click the red trash bin icon next to any workflow on the main dashboard. You'll see a smooth inline confirmation and a real-time loading spinner as the system cascade-deletes the workflow and associated briefs.

---

## 5. API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/workflows/` | `POST` | Creates a new Content Brief & Workflow record. |
| `/api/workflows/` | `GET` | Lists all historical workflows. |
| `/api/workflows/{id}` | `GET` | Fetches details for a specific workflow. |
| `/api/workflows/{id}/start` | `POST` | Triggers the LangGraph background execution. |
| `/api/workflows/{id}/stream` | `GET` (SSE) | Subscribes to real-time progress updates. |
| `/api/workflows/{id}/state` | `GET` | Fetches the internal LangGraph state (draft content, metadata) for UI review. |
| `/api/workflows/{id}/approve` | `POST` | Approves a pending workflow (accepting human edits) and resumes Graph for publishing. |
| `/api/workflows/{id}` | `DELETE` | Cascade-deletes a workflow and its associated brief. |

---

## 6. Recent Enhancements (Changelog)
- **Real-Time UI & Logging**: Fixed SSE SQLAlchemy caching to enable seamless 10% -> 90% UI progress tracking without refreshing. Added real-time terminal `print()` logs to track LangGraph agent progression.
- **Editable Human Review UI**: Upgraded the frontend to fetch the AI's internal memory state and display it in an interactive form, allowing human editors to manually tweak the content before publishing.
- **Cascading Deletion UI/UX**: Added a robust frontend deletion flow with inline confirmations and loading spinners, supported by a backend route that cascade-deletes workflows and content briefs.

---

## 6. Future Roadmap

- [ ] **Google Search Console Integration**: Pull real analytics to automatically suggest new content briefs based on decaying keywords.
- [ ] **Direct Image Generation**: Wire the Media Agent directly to DALL-E 3 or Midjourney API to automatically generate and upload the featured image.
- [ ] **Internal Linking Agent**: Add a node to analyze existing WordPress posts and automatically inject relevant internal links into the new draft.
- [ ] **Team Workspaces**: Support multiple users and RBAC for larger content teams.
