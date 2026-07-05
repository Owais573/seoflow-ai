# SEOFlow AI
## Product Requirements Document (PRD)

Version: 1.1

Status: Draft

Owner: Owais Ansari

---

# 1. Executive Summary

SEOFlow AI is an AI-powered content operations platform designed to automate the complete lifecycle of SEO content creation, approval, and publishing.

Unlike traditional AI writing tools that simply generate articles, SEOFlow AI functions as an AI workforce composed of specialized AI agents collaborating together under a human approval workflow. The entire multi-agent system is orchestrated using LangGraph to ensure a robust, stateful, and observable pipeline.

The platform transforms a simple content brief into a production-ready, SEO-optimized WordPress article through a structured pipeline involving:

- Keyword Research
- SERP Analysis
- Competitor Research
- Content Planning
- AI Article Generation
- Featured Image Prompt Generation
- SEO Metadata
- Schema Generation
- Human Review (with n8n automated notifications)
- WordPress Publishing

The product is intended to showcase production-grade Agentic AI architecture while solving a real business problem faced by marketing agencies, SEO consultants, SaaS companies, and content teams. This MVP is designed to run locally via Docker, demonstrating full-stack engineering, local orchestration, and DevOps best practices.

Although SEOFlow AI begins as an SEO automation platform, the architecture is intentionally modular so that additional marketing agents can be introduced later without major architectural changes.

---

# 2. Vision

Build an AI Operating System for Content Marketing.

Instead of replacing marketers, SEOFlow AI acts as an intelligent team member capable of handling repetitive operational work while allowing humans to focus on strategy and creativity.

Long-term vision:

> "One dashboard where an entire content marketing pipeline can run autonomously while humans simply approve important decisions."

---

# 3. Mission

Reduce the time required to create and publish a high-quality SEO article from several hours to under fifteen minutes while maintaining human oversight and content quality.

---

# 4. Problem Statement

Current SEO content production involves many disconnected tools and repetitive manual tasks.

A typical workflow today looks like:

Topic Research
↓
Keyword Research
↓
Google Search
↓
Competitor Analysis
↓
Outline Creation
↓
Article Writing
↓
SEO Optimization
↓
Meta Description
↓
Schema Creation
↓
Featured Image
↓
WordPress Login
↓
Manual Publishing
↓
Search Console Monitoring
↓
Performance Tracking
↓
Optimization

Each step often requires switching between multiple SaaS platforms.

Typical tools include:
- ChatGPT
- Ahrefs
- SEMRush
- Google Search
- Google Docs
- Grammarly
- Canva
- WordPress
- Google Search Console
- Google Analytics

Problems include:
- Time consuming
- Manual copy-paste
- Context switching
- Inconsistent outputs
- Difficult collaboration
- Poor content standardization
- No workflow orchestration
- Limited audit history

---

# 5. Solution

SEOFlow AI replaces dozens of manual operations with a coordinated AI workflow.

Instead of asking an AI to "write a blog," users provide a structured content brief.

Example:

Topic:
Best AI CRM Software

Target Audience:
Small Businesses

Primary Keyword:
AI CRM

Secondary Keywords:
CRM Automation
Lead Management
AI Sales Tools

Publishing Website:
WordPress

The system then automatically:

✔ Researches the topic
↓
✔ Analyzes Google SERP
↓
✔ Finds competitor patterns
↓
✔ Creates an optimized outline
↓
✔ Writes an SEO article
↓
✔ Generates FAQ section
↓
✔ Generates JSON-LD Schema
↓
✔ Generates SEO title
↓
✔ Generates Meta Description
↓
✔ Creates Internal Link Suggestions
↓
✔ Creates Featured Image Prompt
↓
✔ Waits for Human Approval (Triggers n8n Notification via Slack/Discord)
↓
✔ User Uploads Image & Reviews Content
↓
✔ Publishes to WordPress

---

# 6. Product Goals

Primary Goals
- Automate repetitive SEO operations
- Reduce article production time
- Maintain consistent SEO quality
- Standardize publishing workflow
- Demonstrate production-grade Agentic AI orchestration

Business Goals
- Portfolio flagship project
- GitHub showcase
- Freelance demo
- Upwork proposal asset
- Client acquisition tool

Technical Goals
Demonstrate knowledge of:
- Agentic AI (LangGraph)
- Multi-Agent Systems
- OpenAI API
- WordPress REST API
- Human-in-the-loop workflows
- Event-driven notifications via n8n
- FastAPI & Server-Sent Events (SSE)
- React / Next.js
- PostgreSQL
- Docker & local deployments
- Production software architecture

---

# 7. Target Users

## Primary Users

### Freelancers
Needs:
- Publish blogs faster
- Better SEO
- Less repetitive work
Pain Points:
- Limited time
- Too many tools
- Manual publishing

---

### Marketing Agencies
Needs:
- Content standardization
- Team collaboration
- Client approvals
Pain Points:
- Scaling content
- Maintaining quality
- Repetitive workflows

---

### SaaS Companies
Needs:
- Product marketing
- SEO growth
- Technical content
Pain Points:
- Engineering teams shouldn't spend hours writing blogs.

---

### Startup Founders
Needs:
- Organic growth
- Fast publishing
- Affordable automation
Pain Points:
- Small teams
- Limited budget
- Need leverage

---

# 8. Product Principles

SEOFlow AI follows these principles.

## AI Assists Humans
AI makes recommendations. Humans make final publishing decisions.

## Automation First
Every repetitive task should be automated where practical.

## Explainability
Every AI output should explain:
- why it was generated
- what sources influenced it
- which agent produced it

## Human Approval
Publishing never happens automatically unless explicitly enabled.

## Extensible Architecture
Every AI capability should exist as an independent module.
Future agents should plug into the existing LangGraph orchestration engine.

## API First
Every feature should be accessible through APIs.
Frontend should simply consume backend APIs.

## Production Ready
Avoid prototype shortcuts. Build scalable architecture from Day One.

---

# 9. Success Metrics (KPIs)

Business KPIs
- Articles published
- Time saved per article
- Approval rate
- Average publishing time

AI KPIs
- Average article quality score
- Keyword coverage
- SEO score
- Human edit percentage
- Content readability

System KPIs
- Workflow completion rate
- API latency
- AI response time
- Failed workflow percentage
- Publishing success rate

---

# 10. MVP Scope

Included
✅ Dashboard with Real-time Progress (SSE/WebSockets)
✅ Keyword Research
✅ SERP Analysis
✅ Competitor Analysis
✅ Outline Generation
✅ AI Article Writing
✅ SEO Optimization
✅ FAQ Generation
✅ JSON-LD Schema
✅ Featured Image Prompt Generation
✅ Human Approval UI
✅ Image Upload Support (User uploads manually generated image)
✅ WordPress Publishing
✅ Workflow History (PostgreSQL)
✅ Workflow Orchestration via LangGraph
✅ n8n Automation (Slack/Discord Webhook Notifications for pending reviews)

Excluded (Future Scope)
❌ Google Search Console Monitoring (Future)
❌ Google Analytics Insights (Future)
❌ Actual Image Generation (Future - stick to prompt generation for now)
❌ Prompt Template Management UI (Prompts will be hardcoded in backend)
❌ Multi-user workspace
❌ Billing
❌ Team collaboration
❌ Multiple websites
❌ Webflow / Shopify Integrations
❌ Autonomous Scheduling

---

# 11. High-Level Product Workflow

Content Brief
↓
Research Agent
↓
SERP Analysis Agent
↓
Competitor Analysis Agent
↓
Content Planning Agent
↓
Content Generation Agent
↓
SEO Optimization Agent
↓
Media Agent (Prompt Only)
↓
Review Package Ready
↓
n8n Triggers Notification (Slack/Discord)
↓
Human Approval & Image Upload
↓
Publishing Agent
↓
WordPress

---

# 12. Core AI Agents (Overview)

SEOFlow AI is built around specialized AI agents instead of a single monolithic assistant.
The MVP includes:

1. Research Agent
2. Content Agent
3. SEO Agent
4. Media Agent
5. Publishing Agent
6. LangGraph Workflow Orchestrator

Each agent owns one business capability and communicates through structured state objects within the LangGraph ecosystem. This modular design allows future agents to be added without modifying existing workflows.

---

# 13. Functional Requirements

## 13.1 Dashboard
The Dashboard serves as the central workspace for SEOFlow AI.
The user should be able to:
- Create a new Content Brief
- View recent workflows
- Continue unfinished workflows
- View published articles
- Review pending approvals
- See **real-time** workflow progression via SSE/WebSockets

Dashboard Widgets
- Total Articles
- Draft Articles
- Published Articles
- Pending Reviews
- Workflow Status
- Recent Activity

---

## 13.2 Content Brief
Every workflow starts from a Content Brief.

### Required Fields
- Topic
- Primary Keyword

### Optional Fields
- Secondary Keywords
- Target Audience
- Search Intent
- Country
- Language
- Tone
- Writing Style
- Desired Word Count
- Category
- Tags
- Call To Action
- Internal Pages
- Additional Notes

---

## 13.3 Workflow Management
Every generated article is represented as a Workflow managed by LangGraph.

Workflow Stages
```
Created
    ↓
Research
    ↓
Content Planning
    ↓
Content Generation
    ↓
SEO Optimization
    ↓
Media Prompt Generation
    ↓
Human Review (Wait State)
    ↓
Publishing
```

Each workflow stores:
- Current Status
- Progress
- Created Time
- Completed Time
- Active Agent
- Logs
- Token Usage
- Published URL

---

## 13.4 Draft Management
The system shall allow users to:
- Save Draft
- Edit Draft
- Regenerate Entire Draft
- Regenerate Selected Section
- Delete Draft

---

## 13.5 Human Approval
Publishing should never happen automatically. Before publishing, the user can:
- Edit Content
- Replace Title / Meta Description
- Replace Slug / Categories / Tags
- Review Generated Image Prompt
- **Upload Final Featured Image**
- Approve or Reject

---

## 13.6 Publishing
Publishing Agent should:
- Upload Featured Image to WordPress
- Create Categories & Tags (if missing)
- Publish Draft or Update Existing Post
- Save Published URL

Publishing Modes:
- Draft
- Publish
- Update Existing

---

## 13.7 Workflow History
Every execution should be stored.
Store:
- Workflow
- Agent Outputs (Graph State)
- OpenAI Usage
- Execution Time
- Approval History
- Publishing History

---

# 14. Technical Architecture

## Overview
SEOFlow AI follows a modular Agentic AI architecture utilizing LangGraph for stateful orchestration.

```
                     Next.js Frontend (SSE for Real-Time Updates)
                            │
                            ▼
                      FastAPI Backend
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
   LangGraph Engine    AI Provider        PostgreSQL
          │                 │                 │
          ▼                 ▼                 ▼
   Agent Nodes        GPT-4.1-mini       Database Models
          │
          ▼
   n8n Docker Container (Webhook Listener for Slack/Discord Notifications)
```

---

## Frontend
Framework:
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

Responsibilities:
- Dashboard
- Content Brief
- Workflow Progress (Real-Time UI via SSE)
- Human Review
- Settings

---

## Backend
Framework:
- FastAPI

Responsibilities:
- REST APIs
- Streaming APIs (SSE)
- Workflow State Management (LangGraph)
- Agent Execution
- AI Integration
- WordPress Integration
- Webhook Dispatcher (to n8n)

---

## AI Provider Layer
All agents communicate with one centralized AI Provider.

Benefits:
- Centralized Prompt Management (Hardcoded for MVP)
- Easy Model Switching
- Better Logging
- Cost Tracking

---

## Background Processing
Long-running graph executions should run asynchronously.

Use:
- FastAPI `BackgroundTasks` for invoking LangGraph graphs.
- Webhooks to trigger n8n workflows for notifications.

---

## Local Development Stack
Frontend: Next.js
Backend: FastAPI (with LangGraph)
Database: PostgreSQL
Automation: n8n (Docker)
LLM: GPT-4.1-mini
CMS: WordPress

---

# 15. AI Agent Specifications

SEOFlow AI uses specialized AI agents represented as nodes in LangGraph.

## Research Agent
Purpose: Generate keyword intelligence.
Input: Topic, Keywords
Output: Search Intent, Related Keywords, Questions, Suggested Outline, Competitor URLs
Uses: GPT-4.1-mini

## Content Agent
Purpose: Generate article.
Input: Research Report
Output: Introduction, Sections, FAQs, Conclusion, CTA

## SEO Agent
Purpose: Optimize article.
Output: SEO Title, Meta Description, Slug, Internal/External Links, FAQ Schema, Article Schema, SEO Checklist

## Media Agent
Purpose: Generate image assets prompts.
Output: Featured Image Prompt, Alt Text, Image Caption, Suggested Filename
**Note:** The agent **does not generate images**. The generated prompt is intended for third-party tools. User uploads the final image during Review.

## Publishing Agent
Purpose: Publish article.
Responsibilities: Upload Image, Upload Post, Set Categories/Tags/Slug, Publish
Returns: Published URL

## LangGraph Workflow Orchestrator
Purpose: Coordinate all agents.
Responsibilities:
- Start Graph Execution
- Route between Agent Nodes
- Maintain Global State
- Pause execution for Human-in-the-Loop (Review stage)
- Resume execution upon Approval

---

# 16. API Specifications

## Internal APIs

### Workflow
`POST /api/workflows` - Create workflow.
`GET /api/workflows` - List workflows.
`GET /api/workflows/{id}` - Workflow details.
`GET /api/workflows/{id}/stream` - SSE endpoint for real-time progress.
`POST /api/workflows/{id}/start` - Start execution.
`POST /api/workflows/{id}/approve` - Approve workflow.
`POST /api/workflows/{id}/reject` - Reject workflow.

### Publishing
`POST /api/publish` - Publish article.

### Settings
`GET /api/settings` - Retrieve project settings.
`PUT /api/settings` - Update project settings.

---

## External Integrations

### OpenAI
Purpose: Generate text, schemas, and prompts.

### WordPress REST API
Purpose: Publish Posts, Upload Media, Categories, Tags.
Authentication: Application Passwords.

### n8n (Local)
Purpose: Listen to webhooks from FastAPI to dispatch notifications (e.g., Slack, Discord) when an article is ready for review or successfully published.

---

# 17. Database Design

Database: PostgreSQL

## Tables

### content_briefs
Stores: Topic, Keywords, Tone, Audience, Length

### workflows
Stores: Status, Current Step, Progress, Created At, Completed At

### workflow_logs
Stores: Execution history, Graph State changes.

### research_results
Stores: Research Agent output.

### content_drafts
Stores: Generated articles.

### media_prompts
Stores: Image Prompt, Alt Text, Caption

### reviews
Stores: Approval history.

### published_articles
Stores: Published URLs.

---

## Entity Relationship Diagram
```
Content Brief
      │
      ▼
   Workflow
      │
 ┌────┼─────┐
 ▼    ▼     ▼
Research Draft Media
      │
      ▼
   Review
      │
      ▼
Published Article
```

---

# 18. Project Structure

```
SEOFlow-AI/
frontend/
├── app/
├── components/
├── hooks/
├── lib/
├── services/
├── types/
└── utils/

backend/
├── api/
├── agents/ (LangGraph Nodes)
├── core/
├── database/
├── integrations/
├── models/
├── prompts/ (Hardcoded system prompts)
├── schemas/
├── services/
├── workflows/ (LangGraph Graph setup)
└── main.py

n8n/
├── workflows/ (Exported n8n JSON configs)
└── docker-compose.yml

database/
├── migrations/
└── schema.sql

docs/
assets/
README.md
PRD.md
```

---

# 19. Development Roadmap

## Phase 1: Project Setup
- Next.js & Tailwind setup
- FastAPI & PostgreSQL setup
- n8n Docker configuration

## Phase 2: Core Infrastructure
- Dashboard & Content Brief UI
- LangGraph Workflow Engine scaffolding
- Real-time SSE endpoints

## Phase 3: AI Agents Implementation
- Research Agent
- Content Agent
- SEO Agent
- Media Agent (Prompt generation)

## Phase 4: Human-in-the-Loop & Publishing
- Human Review UI & Image Upload
- n8n Webhook Triggers for Slack/Discord Notifications
- WordPress Integration (Publishing Agent)

## Future Scope (Post-MVP)
- Google Search Console Integration
- Google Analytics Integration
- Analytics Dashboard & SEO Suggestions
- Actual Image Generation APIs (DALL-E)
- Team Collaboration & Billing

---

## MVP Completion Criteria

The project will be considered MVP complete when it supports the following end-to-end workflow:

1. User creates a Content Brief via the Dashboard.
2. LangGraph orchestrates the AI agents to perform research, planning, content generation, SEO optimization, and media prompt generation.
3. The UI updates in real-time via Server-Sent Events (SSE) to show progress.
4. Once drafting is complete, FastAPI triggers a webhook to the local n8n instance, sending a Slack/Discord notification for human review.
5. User reviews the content, modifies as needed, and uploads a manually generated featured image.
6. Publishing Agent securely publishes the article and image to WordPress using the REST API.
7. All workflow history, logs, and outputs are stored locally in PostgreSQL.
