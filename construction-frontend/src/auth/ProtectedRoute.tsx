import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoadingState } from "../components/StateView";
import { useAuth } from "./auth-context";

export function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="screen-center">
        <LoadingState message="Loading session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
