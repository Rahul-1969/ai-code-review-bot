<div align="center">
  <h1>🛡️ CodeGuardian AI</h1>
  <p><em>An AI-powered code review platform inspired by CodeRabbit and SonarQube</em></p>
</div>

<br />

## 📖 Overview
CodeGuardian AI is an intelligent code review platform that combines deterministic static analysis (Pylint, Bandit) with advanced generative AI (Google Gemini) to deliver comprehensive, context-aware code reviews. By automating structural analysis and correlating it with AI insights, CodeGuardian AI surfaces logic errors, security vulnerabilities, and architectural anti-patterns with precise, actionable suggestions.

## ✨ Features
- **Intelligent Reviews**: Context-aware AI reviews mapping directly to lines of code.
- **Static Analysis Integration**: Built-in support for Pylint and Bandit to catch deterministic issues.
- **Continuous Learning Loop**: The system learns from your accepted/rejected feedback to identify and adapt to your team's unique anti-patterns.
- **Automated PR Reviews**: Native GitHub Webhook integration to automatically scan and review Pull Requests just like a CI pipeline.
- **Background Processing**: Heavy scanning and analysis tasks are offloaded to asynchronous Celery workers.
- **Beautiful Dashboard**: A modern, claymorphic React SPA to manage reviews, historical feedback, and PDF report exports.

## 🏗️ Architecture

```mermaid
graph TD
    A[React Frontend] -->|REST API| B(FastAPI Backend)
    B --> C[(PostgreSQL)]
    B -->|Task Dispatch| D{Redis Broker}
    D --> E[Celery Worker]
    E --> F[PyGithub API]
    E --> G[Pylint & Bandit]
    E --> H[Google Gemini LLM]
    E --> C
```

## 🛠️ Tech Stack
- **Frontend**: React, Vite, React Router, Axios
- **Backend**: Python 3.12, FastAPI, SQLAlchemy, Pydantic, JWT Auth
- **Workers**: Celery, Redis
- **Database**: PostgreSQL
- **AI Model**: Google Gemini Pro
- **Containerization**: Docker, Docker Compose

## 🚀 Installation & Local Setup

### Prerequisites
- Docker & Docker Compose
- Node.js (v20+)
- Python 3.12+ (if running without Docker)
- PostgreSQL & Redis (if running without Docker)
- A Google Gemini API Key

### 🐳 Docker Setup (Recommended)
1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/code-guardian-ai.git
   cd code-guardian-ai
   ```
2. **Configure Environment Variables:**
   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@postgres:5432/codeguardian
   REDIS_URL=redis://redis:6379/0
   GEMINI_API_KEY=your_gemini_api_key
   SECRET_KEY=your_super_secret_jwt_key
   ```
3. **Launch the stack:**
   ```bash
   docker-compose up --build
   ```
   *The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:8000`.*

## 📸 Screenshots
*(Insert your application screenshots here)*
- **Dashboard View**: `![Dashboard](docs/images/dashboard.png)`
- **AI Review Insights**: `![Review Insights](docs/images/review.png)`

## 🔌 API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | `POST` | Register a new user |
| `/auth/login` | `POST` | Authenticate and obtain JWT |
| `/review/analyze` | `POST` | Submit raw Python code for immediate AI review |
| `/history/` | `GET` | Retrieve the authenticated user's review history |
| `/github/scan` | `POST` | Enqueue a full GitHub repository scan |
| `/github/webhook` | `POST` | Ingress for automated GitHub PR review triggers |
| `/reports/download/{id}` | `GET` | Export a review as a PDF report |

## 📁 Folder Structure
```text
code-guardian-ai/
├── backend/
│   ├── agents/          # AI and static analysis sub-agents
│   ├── auth/            # JWT security and password hashing
│   ├── database/        # SQLAlchemy models and connections
│   ├── github_integration/# PyGithub PR and webhook orchestrators
│   ├── routes/          # FastAPI endpoint routers
│   ├── tasks/           # Celery background tasks
│   └── tests/           # Pytest suite
├── frontend/
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── components/  # Reusable React UI components
│   │   ├── pages/       # Route-level views (Dashboard, History)
│   │   └── services/    # Axios API clients
│   └── package.json
├── docs/                # Architecture & deployment guides
├── docker-compose.yml   # Multi-container orchestration
└── README.md
```

## 🗺️ Future Roadmap
- [ ] Add support for JavaScript/TypeScript static analysis (ESLint).
- [ ] Implement inline IDE extensions (VSCode / IntelliJ).
- [ ] Deploy native OAuth GitHub Login integration.
- [ ] Introduce team-based Workspaces and Role-Based Access Control (RBAC).

## 📄 License
This project is licensed under the MIT License. See the `LICENSE` file for details.
