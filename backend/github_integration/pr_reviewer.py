import os
from github import Github
from github.GithubException import UnknownObjectException
from agents.gemini_review_agent import GeminiReviewAgent

def review_pull_request(repo_name: str, pr_number: int, user_id: int = None) -> dict:
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        raise ValueError("GITHUB_TOKEN environment variable not set")

    g = Github(token)

    try:
        repo = g.get_repo(repo_name)
    except UnknownObjectException:
        raise ValueError(f"Repository {repo_name} not found or access denied")

    try:
        pr = repo.get_pull(pr_number)
    except UnknownObjectException:
        raise ValueError(f"Pull request #{pr_number} not found in {repo_name}")


    gemini_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_key:
        raise ValueError("GEMINI_API_KEY environment variable not set")
    agent = GeminiReviewAgent(api_key=gemini_key)
    review_results = []

    for file in pr.get_files():
        if file.filename.endswith(".py") and file.patch:
            file_review = agent.review(file.patch)
            review_results.append({
                "filename": file.filename,
                "review": file_review
            })

    return {
        "pr_number": pr_number,
        "repo_name": repo_name,
        "files_reviewed": len(review_results),
        "results": review_results
    }
