from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import (
    auth_routes,
    export_routes,
    feedback_routes,
    github_routes,
    history_routes,
    learning_routes,
    pattern_routes,
    pr_routes,
    report_routes,
    review_routes,
    task_routes,
    repositories_routes,
    webhook_routes,
    websocket_routes
)

app = FastAPI(title="Code Review Bot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(export_routes.router)
app.include_router(feedback_routes.router)
app.include_router(github_routes.router)
app.include_router(history_routes.router)
app.include_router(learning_routes.router)
app.include_router(pattern_routes.router)
app.include_router(pr_routes.router)
app.include_router(report_routes.router)
app.include_router(review_routes.router)
app.include_router(task_routes.router)
app.include_router(repositories_routes.router)
app.include_router(webhook_routes.router)
app.include_router(websocket_routes.router)
