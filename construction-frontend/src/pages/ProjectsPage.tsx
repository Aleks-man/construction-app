import { useAuth } from "../auth/auth-context";

export function ProjectsPage() {
  const { logout, user } = useAuth();

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Projects</p>
          <h1>Construction workspace</h1>
        </div>

        <div className="user-menu">
          <span>{user?.email}</span>
          <button className="secondary-button" onClick={logout} type="button">
            Sign out
          </button>
        </div>
      </header>

      <section className="empty-state">
        <h2>Frontend auth flow is ready</h2>
        <p className="muted">
          The next step is connecting this page to the projects API and rendering real project
          data.
        </p>
      </section>
    </main>
  );
}
