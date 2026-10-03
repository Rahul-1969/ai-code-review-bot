import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Create a configured Axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------------------------------------------------------------------------
// Interceptors
// ---------------------------------------------------------------------------

// Request interceptor: Attach the Bearer token to every request if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Extract data and format errors uniformly
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Extract FastAPI's standard "detail" string if it exists
    const message = error.response?.data?.detail || error.message || "Request failed";
    return Promise.reject(new Error(message));
  }
);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/** POST /auth/login — Authenticate a user and receive an access token. */
export const loginUser = (email, password) =>
  apiClient.post("/auth/login", { email, password });

/** POST /auth/register — Register a new user. */
export const registerUser = (username, email, password) =>
  apiClient.post("/auth/register", { username, email, password });

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------

/** POST /review/analyze — run the full pipeline on submitted code. */
export const analyzeCode = (code) =>
  apiClient.post("/review/analyze", { code });

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

/** GET /history/ — fetch review history for the authenticated user. */
export const getUserHistory = () => apiClient.get("/history/");

/** GET /history/:id — fetch full details for a specific review history item. */
export const getHistoryDetail = (id) => apiClient.get(`/history/${id}`);

/** DELETE /history/:id — delete a review history item. */
export const deleteUserHistory = (id) => apiClient.delete(`/history/${id}`);

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

/** POST /feedback/accept — accept a review by id. */
export const acceptReview = (review_id) =>
  apiClient.post("/feedback/accept", { review_id });

/** POST /feedback/reject — reject a review with a reason. */
export const rejectReview = (review_id, reason) =>
  apiClient.post("/feedback/reject", { review_id, reason });

/** GET /feedback/ — fetch all feedback records. */
export const getAllFeedback = () => apiClient.get("/feedback/");

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------

/** GET /patterns/ — fetch all Pattern rows. */
export const getAllPatterns = () => apiClient.get("/patterns/");

/** GET /patterns/summary — fetch preferred category, severity, confidence. */
export const getPatternSummary = () => apiClient.get("/patterns/summary");

// ---------------------------------------------------------------------------
// Learning
// ---------------------------------------------------------------------------

/** POST /learning/refresh — trigger LearningAgent and upsert patterns. */
export const refreshLearning = () => apiClient.post("/learning/refresh");

/** GET /learning/summary — fetch learning summary from Pattern table. */
export const getLearningSummary = () => apiClient.get("/learning/summary");

// ---------------------------------------------------------------------------
// GitHub
// ---------------------------------------------------------------------------

/** POST /github/scan — run the pipeline against an entire remote repository. */
export const scanRepository = (repo_url) =>
  apiClient.post("/github/scan", { repo_url });

/** POST /github/pr-review — run the pipeline against a specific Pull Request. */
export const reviewPullRequest = (repo_name, pr_number) =>
  apiClient.post("/github/pr-review", { repo_name, pr_number });

// ---------------------------------------------------------------------------
// Repositories
// ---------------------------------------------------------------------------

/** GET /repositories/ — fetch all repository scans for the authenticated user. */
export const getRepositories = () => apiClient.get("/repositories/");

/** GET /repositories/:id — Fetch detailed scan results for a specific repository. */
export const getRepositoryDetail = (id) => apiClient.get(`/repositories/${id}`);

/** DELETE /repositories/:id — delete a repository scan. */
export const deleteRepository = (id) => apiClient.delete(`/repositories/${id}`);

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

/** POST /tasks/:id/stop — Stop a running background task. */
export const stopTask = (task_id) => apiClient.post(`/tasks/${task_id}/stop`);

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

/** GET /repositories/ — fetch repository scans to aggregate analytics. */
export const getAnalytics = () => apiClient.get("/repositories/");

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/** GET /export/csv — download repositories as CSV blob. */
export const downloadRepositoriesCSV = () =>
  apiClient.get("/export/csv", { responseType: "blob" });

/** GET /export/json — download repositories as JSON blob. */
export const downloadRepositoriesJSON = () =>
  apiClient.get("/export/json", { responseType: "blob" });

/** GET /export/excel — download repositories as Excel blob. */
export const downloadRepositoriesExcel = () =>
  apiClient.get("/export/excel", { responseType: "blob" });
