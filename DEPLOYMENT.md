# AI Code Review Bot Deployment Guide

This guide details the production-ready deployment process for the AI Code Review Bot architecture. This infrastructure ensures high availability, scalability, and secure separation of concerns for a production-grade deployment.

## Architecture Overview
- **Frontend**: Vercel (React / Vite)
- **Backend & Background Workers**: Railway (FastAPI, Celery)
- **Database**: Supabase (PostgreSQL)
- **Message Broker**: Upstash (Redis)

---

## Step 1: Provision Upstash Redis
1. Go to [Upstash](https://upstash.com/) and log in.
2. Create a new **Redis Database** (Serverless).
3. Copy the **Redis Connection URL** (e.g., `rediss://default:<password>@<endpoint>:<port>`). Note that this will be used for both the Celery broker and backend result configurations.

## Step 2: Provision Supabase PostgreSQL
1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Navigate to **Project Settings > Database**.
3. Under **Connection string**, select the **URI** format.
4. Copy the connection string. Ensure you replace `[YOUR-PASSWORD]` with your actual database password. (e.g., `postgresql://postgres:[YOUR-PASSWORD]@db.<ref>.supabase.co:5432/postgres`).
*Note: For SQLAlchemy, ensure you are using the standard port 5432 connection or the connection pooler (port 6543) if you anticipate high concurrency.*

## Step 3: Deploy Backend & Celery Worker to Railway
1. Go to [Railway](https://railway.app/) and create a new project.
2. Select **Deploy from GitHub repo** and choose your code repository.
3. Configure the **Backend Service**:
   - Navigate to the service settings and set the **Root Directory** to `/backend`.
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Configure the **Celery Worker Service** (Add another GitHub repo service from the same repository):
   - Set the **Root Directory** to `/backend`.
   - **Start Command**: `celery -A tasks.celery_app worker --loglevel=info`
5. Navigate to the **Variables** tab for **both** services and add the following Environment Variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Your Supabase PostgreSQL Connection String |
| `REDIS_URL` | Your Upstash Redis Connection String |
| `SECRET_KEY` | A long, random string for JWT signing (e.g., generate via `openssl rand -hex 32`) |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` (e.g., 7 days in minutes) |
| `GEMINI_API_KEY` | Your Google Gemini API Key |
| `GITHUB_TOKEN` | A GitHub Personal Access Token (for the repo code scanner) |
| `WEBHOOK_SECRET` | Secret used to securely verify incoming GitHub webhook payloads |
| `FRONTEND_URL` | The URL of your Vercel frontend (e.g., `https://my-app.vercel.app`) for CORS |

## Step 4: Deploy Frontend to Vercel
1. Go to [Vercel](https://vercel.com/) and import your GitHub repository.
2. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
3. Expand **Environment Variables** and add:

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Your Railway Backend Public URL (e.g., `https://backend-production.up.railway.app`) |

4. Click **Deploy**. Vercel will automatically build and host your React application globally on its Edge Network.

## Step 5: Configure GitHub Webhooks (Optional)
If you are leveraging the automated GitHub webhook integration to review opened PRs:
1. Navigate to your target GitHub Repository > **Settings** > **Webhooks** > **Add webhook**.
2. **Payload URL**: Your Railway backend URL + `/github/webhook` (e.g., `https://backend-production.up.railway.app/github/webhook`).
3. **Content type**: `application/json`.
4. **Secret**: The exact value you set for `WEBHOOK_SECRET` in Railway.
5. Select **Let me select individual events** and check:
   - **Pull requests**
   - **Pushes** (if your workflow requires push scanning)
6. Save and verify the ping event returns a success status.

## Step 6: Post-Deployment Verification
- Navigate to your Vercel frontend URL.
- Register a new account to test database write connectivity (Supabase).
- Submit a repository URL in the dashboard to test backend background tasks (Railway Celery worker + Upstash Redis).
- Verify the Gemini API processes the code and successfully returns the AI review directly on the frontend dashboard.
