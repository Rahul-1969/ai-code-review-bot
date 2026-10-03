import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import History from "./pages/History";
import Feedback from "./pages/Feedback";
import Patterns from "./pages/Patterns";
import GitHubScanner from "./pages/GitHubScanner";
import PRReview from "./pages/PRReview";
import Repositories from "./pages/Repositories";
import Analytics from "./pages/Analytics";
import ExportCenter from "./pages/ExportCenter";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

import ToastProvider from "./components/ToastProvider";
import Footer from "./components/Footer";

export default function App() {
  // The Navbar will now internally check isAuthenticated instead of App conditionally rendering it.

  return (
    <BrowserRouter>
      <ToastProvider />
      <div className="app-container">
        {/* Navbar handles its own conditional rendering */}
        <Navbar />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <ProtectedRoute>
                <Feedback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patterns"
            element={
              <ProtectedRoute>
                <Patterns />
              </ProtectedRoute>
            }
          />
          <Route
            path="/github"
            element={
              <ProtectedRoute>
                <GitHubScanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pr-review"
            element={
              <ProtectedRoute>
                <PRReview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/repositories"
            element={
              <ProtectedRoute>
                <Repositories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/export-center"
            element={
              <ProtectedRoute>
                <ExportCenter />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
