import { useEffect, useState, type ComponentProps } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ApiError } from "../api/client";
import { createProject, getProjects, type Project } from "../api/projects";
import { useAuth } from "../auth/auth-context";
import { EmptyState, ErrorState, LoadingState } from "../components/StateView";

export function ProjectsPage() {
  const { user } = useAuth();
  const { i18n, t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const canCreateProject = user?.role === "ADMIN" || user?.role === "MANAGER";
  const hasProjectLoadError = !isLoading && Boolean(error) && projects.length === 0;

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      try {
        const projectsResponse = await getProjects();

        if (isMounted) {
          setProjects(projectsResponse);
        }
      } catch (projectsError) {
        if (isMounted) {
          setError(getProjectErrorMessage(projectsError, t("projects.loadError")));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, [t]);

  const handleCreateProject: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();

    const name = projectName.trim();

    if (!name) {
      return;
    }

    setError("");
    setIsCreating(true);

    try {
      const createdProject = await createProject({ name });
      setProjects((currentProjects) => [createdProject, ...currentProjects]);
      setProjectName("");
    } catch (createError) {
      setError(getProjectErrorMessage(createError, t("projects.loadError")));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="app-shell">
      <header className="page-heading">
        <p className="eyebrow">{t("projects.eyebrow")}</p>
        <h1>{t("projects.title")}</h1>
        <p className="muted">{t("projects.description")}</p>
      </header>

      {canCreateProject ? (
        <section className="panel">
          <div>
            <h2>{t("projects.createTitle")}</h2>
            <p className="muted">{t("projects.createDescription")}</p>
          </div>

          <form className="inline-form" onSubmit={handleCreateProject}>
            <label>
              {t("projects.projectName")}
              <input
                aria-describedby={error && !hasProjectLoadError ? "project-create-error" : undefined}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder={t("projects.projectNamePlaceholder")}
                value={projectName}
              />
            </label>
            <button disabled={isCreating || !projectName.trim()} type="submit">
              {isCreating ? t("common.creating") : t("common.create")}
            </button>
          </form>
        </section>
      ) : null}

      {error && !hasProjectLoadError ? (
        <p className="form-error" id="project-create-error">
          {error}
        </p>
      ) : null}

      <section className="projects-section">
        <div className="section-heading">
          <div>
            <h2>{t("projects.listTitle")}</h2>
            <p className="muted">{t("projects.listDescription")}</p>
          </div>
          <span className="counter-badge">{projects.length}</span>
        </div>

        {isLoading ? <LoadingState message={t("projects.loading")} /> : null}

        {hasProjectLoadError ? (
          <ErrorState message={error} title={t("projects.unavailable")} />
        ) : null}

        {!isLoading && !error && projects.length === 0 ? (
          <EmptyState
            message={t("projects.emptyMessage")}
            title={t("projects.emptyTitle")}
          />
        ) : null}

        {!isLoading && projects.length > 0 ? (
          <div className="projects-grid">
            {projects.map((project) => (
              <Link className="project-card" key={project.id} to={`/projects/${project.id}`}>
                <div>
                  <p className="eyebrow">{t("projects.cardEyebrow", { id: project.id })}</p>
                  <h3>{project.name}</h3>
                  <p className="muted">
                    {t("common.created")} {formatDate(project.createdAt, i18n.language)}
                  </p>
                </div>

                <dl className="project-stats">
                  <div>
                    <dt>{t("projects.statsStages")}</dt>
                    <dd>{project.stages.length}</dd>
                  </div>
                  <div>
                    <dt>{t("projects.statsTasks")}</dt>
                    <dd>{countProjectTasks(project)}</dd>
                  </div>
                  <div>
                    <dt>{t("projects.statsMembers")}</dt>
                    <dd>{project.users.length}</dd>
                  </div>
                </dl>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function countProjectTasks(project: Project) {
  return project.stages.reduce((tasksCount, stage) => tasksCount + stage.tasks.length, 0);
}

function formatDate(date: string, language: string) {
  return new Intl.DateTimeFormat(language, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getProjectErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}
