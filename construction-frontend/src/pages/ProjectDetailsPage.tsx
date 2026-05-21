import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { getProjectById, type Project, type ProjectTask } from "../api/projects";

export function ProjectDetailsPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const parsedProjectId = Number(projectId);

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
  }, [projectId]);

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
