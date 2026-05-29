import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/auth-context";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

export function AppLayout() {
  const { logout, user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">{t("common.brand")}</p>
          <h1>{t("common.appName")}</h1>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <NavLink to="/projects">{t("nav.projects")}</NavLink>
          <NavLink to="/my-tasks">{t("nav.myTasks")}</NavLink>
          {user?.role === "ADMIN" ? <NavLink to="/users">{t("nav.users")}</NavLink> : null}
        </nav>
      </aside>

      <div className="dashboard-main">
        <header className="app-header">
          <div>
            <p className="eyebrow">{t("common.workspace")}</p>
            <strong>{user ? t(`roles.${user.role}`) : ""}</strong>
          </div>

          <div className="user-menu">
            <LanguageSwitcher />
            <span>{user?.email}</span>
            <button className="secondary-button" onClick={logout} type="button">
              {t("common.signOut")}
            </button>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
