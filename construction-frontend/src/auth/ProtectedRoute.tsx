import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LoadingState } from "../components/StateView";
import { useAuth } from "./auth-context";

export function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="screen-center">
        <LoadingState message={t("auth.loadingSession")} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
