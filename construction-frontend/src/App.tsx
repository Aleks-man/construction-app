import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { ProjectDetailsPage } from "./pages/ProjectDetailsPage";
import { ProjectsPage } from "./pages/ProjectsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/projects" replace />} />
    </Routes>
  );
}
