import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/auth-context";

export function AppLayout() {
  const { logout, user } = useAuth();

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Construction</p>
          <h1>Project Control</h1>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <NavLink to="/projects">Projects</NavLink>
        </nav>
      </aside>

      <div className="dashboard-main">
        <header className="app-header">
          <div>
            <p className="eyebrow">Workspace</p>
            <strong>{user?.role}</strong>
          </div>

          <div className="user-menu">
            <span>{user?.email}</span>
            <button className="secondary-button" onClick={logout} type="button">
              Sign out
            </button>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
