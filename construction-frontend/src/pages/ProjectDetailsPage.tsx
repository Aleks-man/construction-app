import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { getProjectById, type Project, type ProjectTask } from "../api/projects";
import { createStage } from "../api/stages";
import { useAuth } from "../auth/auth-context";

export function ProjectDetailsPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [stageName, setStageName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingStage, setIsCreatingStage] = useState(false);
  const canCreateStage = user?.role === "ADMIN" || user?.role === "MANAGER";
  const parsedProjectId = useMemo(() => Number(projectId), [projectId]);

  useEffect(() => {
    let isMounted = true;

    async function loadProject() {
      if (!Number.isInteger(parsedProjectId) || parsedProjectId <= 0) {
        setError("Project id is invalid");
        setIsLoading(false);
        return;
      }

      try {
        const projectResponse = await getProjectById(parsedProjectId);

        if (isMounted) {
          setProject(projectResponse);
        }
      } catch (projectError) {
        if (isMounted) {
          setError(getProjectErrorMessage(projectError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      isMounted = false;
    };
  }, [parsedProjectId]);

  const handleCreateStage: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();

    if (!project) {
      return;
    }

    const name = stageName.trim();

    if (!name) {
      return;
    }

    setError("");
    setIsCreatingStage(true);

    try {
      const createdStage = await createStage({ name, projectId: project.id });
      setProject({
        ...project,
        stages: [...project.stages, createdStage],
      });
      setStageName("");
    } catch (stageError) {
      setError(getProjectErrorMessage(stageError));
    } finally {
      setIsCreatingStage(false);
    }
  };

  if (isLoading) {
    return (
      <main className="app-shell">
        <p className="muted">Loading project...</p>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className="app-shell">
        <Link className="text-link" to="/projects">
          Back to projects
        </Link>
        <div className="empty-state">
          <h1>Project unavailable</h1>
          <p className="muted">{error || "Unable to load project"}</p>
        </div>
      </main>
    );
  }

  const tasks = project.stages.flatMap((stage) => stage.tasks);

  return (
    <main className="app-shell">
      <Link className="text-link" to="/projects">
        Back to projects
      </Link>

      <header className="project-hero">
        <div>
          <p className="eyebrow">Project #{project.id}</p>
          <h1>{project.name}</h1>
          <p className="muted">Created {formatDate(project.createdAt)}</p>
        </div>

        <dl className="summary-grid">
          <div>
            <dt>Stages</dt>
            <dd>{project.stages.length}</dd>
          </div>
          <div>
            <dt>Tasks</dt>
            <dd>{tasks.length}</dd>
          </div>
          <div>
            <dt>Members</dt>
            <dd>{project.users.length}</dd>
          </div>
        </dl>
      </header>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Team</h2>
            <p className="muted">People assigned to this construction project.</p>
          </div>
        </div>

        {project.users.length > 0 ? (
          <div className="members-list">
            {project.users.map((member) => (
              <div className="member-row" key={member.userId}>
                <span>{member.user.email}</span>
                <strong>{member.user.role}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No members assigned yet.</p>
        )}
      </section>

      {canCreateStage ? (
        <section className="panel">
          <div>
            <h2>Create stage</h2>
            <p className="muted">Add a project stage to organize construction work.</p>
          </div>

          <form className="inline-form" onSubmit={handleCreateStage}>
            <label>
              Stage name
              <input
                onChange={(event) => setStageName(event.target.value)}
                placeholder="Foundation"
                value={stageName}
              />
            </label>
            <button disabled={isCreatingStage || !stageName.trim()} type="submit">
              {isCreatingStage ? "Creating..." : "Create"}
            </button>
          </form>
        </section>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      <section className="stages-layout">
        {project.stages.length > 0 ? (
          project.stages.map((stage) => (
            <article className="stage-column" key={stage.id}>
              <div className="stage-header">
                <h2>{stage.name}</h2>
                <span className="counter-badge">{stage.tasks.length}</span>
              </div>

              {stage.tasks.length > 0 ? (
                <div className="tasks-list">
                  {stage.tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              ) : (
                <p className="muted">No tasks in this stage.</p>
              )}
            </article>
          ))
        ) : (
          <div className="empty-state">
            <h2>No stages yet</h2>
            <p className="muted">Create project stages to start organizing work.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function TaskCard({ task }: { task: ProjectTask }) {
  return (
    <article className="task-card">
      <div className="task-card-header">
        <h3>{task.title}</h3>
        <span className={`status-pill status-${task.status.toLowerCase()}`}>{task.status}</span>
      </div>

      {task.description ? <p className="muted">{task.description}</p> : null}

      <div className="task-meta">
        <span>{task.priority}</span>
        <span>{task.dueDate ? formatDate(task.dueDate) : "No due date"}</span>
      </div>
    </article>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getProjectErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Unable to load project";
}
