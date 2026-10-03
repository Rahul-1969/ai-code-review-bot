import { Navigate } from "react-router-dom";
import useAuthStore from "../stores/authStore";

export default function ProtectedRoute({ children }) {
  // Extract token from the Zustand store
  const token = useAuthStore((state) => state.token);

  // If no token exists, the user is unauthenticated
  if (!token) {
    // Redirect them to the /login page
    // Using `replace: true` replaces the current entry in the history stack,
    // so the user can't click "back" to return to the protected route they were denied access to.
    return <Navigate to="/login" replace />;
  }

  // If the user is authenticated, render the protected component
  return children;
}
