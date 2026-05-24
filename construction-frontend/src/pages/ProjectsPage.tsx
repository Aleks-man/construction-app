import { useEffect, useState, type ComponentProps } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/client";
import { createProject, getProjects, type Project } from "../api/projects";
import { useAuth } from "../auth/auth-context";
import { EmptyState, ErrorState, LoadingState } from "../components/StateView";

export function ProjectsPage() {
  const { user } = useAuth();
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
          setError(getProjectErrorMessage(projectsError));
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
  }, []);

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
      setError(getProjectErrorMessage(createError));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="app-shell">
      <header className="page-heading">
        <p className="eyebrow">Projects</p>
        <h1>Construction workspace</h1>
        <p className="muted">Plan projects, organize stages and track field work.</p>
      </header>

      {canCreateProject ? (
        <section className="panel">
          <div>
            <h2>Create project</h2>
            <p className="muted">Start a construction project and organize stages and tasks.</p>
          </div>

          <form className="inline-form" onSubmit={handleCreateProject}>
            <label>
              Project name
              <input
                aria-describedby={error && !hasProjectLoadError ? "project-create-error" : undefined}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Residential complex A"
                value={projectName}
              />
            </label>
            <button disabled={isCreating || !projectName.trim()} type="submit">
              {isCreating ? "Creating..." : "Create"}
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
            <h2>Projects</h2>
            <p className="muted">Track project teams, stages and active task progress.</p>
          </div>
          <span className="counter-badge">{projects.length}</span>
        </div>

        {isLoading ? <LoadingState message="Loading projects..." /> : null}

        {hasProjectLoadError ? <ErrorState message={error} title="Projects unavailable" /> : null}

        {!isLoading && !error && projects.length === 0 ? (
          <EmptyState
            message="Create the first project to begin planning stages, tasks and team assignments."
            title="No projects yet"
          />
        ) : null}

        {!isLoading && projects.length > 0 ? (
          <div className="projects-grid">
            {projects.map((project) => (
              <Link className="project-card" key={project.id} to={`/projects/${project.id}`}>
                <div>
                  <p className="eyebrow">Project #{project.id}</p>
                  <h3>{project.name}</h3>
                  <p className="muted">Created {formatDate(project.createdAt)}</p>
                </div>

                <dl className="project-stats">
                  <div>
                    <dt>Stages</dt>
                    <dd>{project.stages.length}</dd>
                  </div>
                  <div>
                    <dt>Tasks</dt>
                    <dd>{countProjectTasks(project)}</dd>
                  </div>
                  <div>
                    <dt>Members</dt>
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

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getProjectErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Unable to load projects";
}
