# SEOFlow AI - Manual Testing Verification List

This guide will walk you through a complete, end-to-end manual test of the SEOFlow AI platform to ensure every component (Frontend, Backend, Database, LangGraph Agents, and WordPress Integration) is working flawlessly.

---

## Part 1: Initial Setup & Running the Services

### 1. Database & Automations (Docker)
- [ ] Open a terminal and navigate to `infra/`.
- [ ] Run `docker-compose up -d`.
- [ ] **Check:** Open your browser and go to `http://localhost:8080`. Ensure you can log into Adminer using `seoflow_user` and `seoflow_password`.
- [ ] **Check:** Ensure the `seoflow_db` database exists and contains tables (`workflows`, `content_briefs`).

### 2. Backend (FastAPI)
- [ ] Ensure your `backend/.env` file has valid values for:
  - `DATABASE_URL`
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL` (e.g., `gpt-4.1-mini` or `gpt-4o-mini` if you don't have access to 4.1 yet)
  - `WP_URL`, `WP_USERNAME`, `WP_APP_PASSWORD`
- [ ] Open a terminal and navigate to `backend/`.
- [ ] Run `uv run uvicorn main:app --reload`.
- [ ] **Check:** You should see `Uvicorn running on http://127.0.0.1:8000` with no startup errors.

### 3. Frontend (Next.js)
- [ ] Open a new terminal and navigate to `frontend/`.
- [ ] Run `npm run dev`.
- [ ] **Check:** You should be able to open `http://localhost:3000` in your browser and see the SEOFlow AI Dashboard without any errors.

---

## Part 2: End-to-End Workflow Testing

### 1. Creating a Content Brief
- [ ] On the Dashboard (`http://localhost:3000`), click the **"New Content Brief"** button.
- [ ] Fill out the brief:
  - **Topic:** e.g., "The Future of AI in Content Marketing"
  - **Primary Keyword:** e.g., "AI content marketing"
- [ ] Submit the form.
- [ ] **Check:** You should be instantly redirected to a Workflow Details page (e.g., `/workflows/1`).

### 2. Monitoring Real-Time Agent Execution
- [ ] On the Workflow Details page, observe the progress bar and status indicator.
- [ ] **Check:** Below the progress bar, observe the **Live Agent Execution Logs** terminal. You should see real-time streaming updates of agent actions, including their specific LLM token consumption (e.g., `[Tokens: ↑120 | ↓45]`). You can also click the "Copy Logs" button to copy the entire terminal history.
- [ ] **Check:** The status should change from `CREATED` -> `RESEARCH` -> `CONTENT_PLANNING` -> `SEO_OPTIMIZATION` -> `PENDING_REVIEW`.
- [ ] **Check:** The progress bar should smoothly fill up from 0% to 90% as the LangGraph agents communicate in the background.

### 2.5 Global System Observability (Monitoring Dashboard)
- [ ] Open a new browser tab and navigate to `http://localhost:3000/monitoring` (or click "Monitoring" in the top navigation bar).
- [ ] **Check:** You should see 4 active KPI cards (Active Streams, Token Burn Rate, System Latency, Human Pipeline).
- [ ] **Check:** The "System Latency" metric should accurately reflect the active automated processing time (excluding human wait time).
- [ ] **Check:** The Agent Efficiency Table should list execution latencies and total token counts for each agent.
- [ ] **Check:** The "Global Log Stream" terminal at the bottom should show live telemetry from any concurrently running workflows.

### 3. Verification of Agent Outputs (Backend check)
- [ ] Check the `backend/` terminal window logs. 
- [ ] **Check:** You should see logs indicating that the `research_node`, `content_node`, `seo_node`, and `media_node` were executed sequentially without Python traceback errors.
- [ ] *Optional check:* You can log into Adminer (`http://localhost:8080`), look at the `workflows` table, and verify that your latest workflow is in the `PENDING_REVIEW` state.

### 4. Human-in-the-Loop Review
- [ ] Back on the frontend Workflow Details page, the UI should now show a yellow box stating: **"Action Required: Human Review"**.
- [ ] **Check:** A button labeled **"Approve & Publish"** should be visible and clickable.
- [ ] (If you have a local n8n instance setup): Check your n8n interface or your Slack/Discord to ensure the webhook notification fired successfully when the state changed to pending review.

### 5. Final Publishing to WordPress
- [ ] Click **"Approve & Publish"**.
- [ ] **Check:** The button should change to "Publishing..." and you should get a success alert.
- [ ] **Check:** The Server-Sent Events (SSE) should catch the final update, changing the status to `PUBLISHED` and pushing the progress bar to `100%`.
- [ ] Open your WordPress admin panel (`https://darkslategrey-elephant-811697.hostingersite.com/wp-admin`).
- [ ] Go to **Posts -> All Posts**.
- [ ] **Check:** The newly generated article should be sitting at the top of your list as a Draft (or Published depending on your WP setup)! The content inside should be fully populated in Markdown/HTML blocks.

---

## Troubleshooting Checklist
- **If the frontend shows "Failed to fetch":** Ensure your FastAPI backend terminal is running and did not crash.
- **If the Progress Bar gets stuck at 10%:** Your OpenAI API Key might be invalid or out of credits. Check the FastAPI terminal for `AuthenticationError` or `RateLimitError`.
- **If publishing fails:** Ensure your WordPress URL in `.env` doesn't have a trailing slash (it should be exactly `https://...hostingersite.com`) and that the Application Password was generated specifically for the REST API.
