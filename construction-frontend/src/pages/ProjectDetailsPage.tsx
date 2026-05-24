import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import {
  getProjectById,
  type Project,
  type ProjectStage,
  type ProjectTask,
  type TaskPriority,
  type TaskStatus,
} from "../api/projects";
import { createStage } from "../api/stages";
import { createTask, updateTaskStatus } from "../api/tasks";
import { useAuth } from "../auth/auth-context";

export function ProjectDetailsPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [stageName, setStageName] = useState("");
  const [taskDrafts, setTaskDrafts] = useState<Record<number, TaskDraft>>({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingStage, setIsCreatingStage] = useState(false);
  const [creatingTaskStageId, setCreatingTaskStageId] = useState<number | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const canCreateStage = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canCreateTask = user?.role === "ADMIN" || user?.role === "MANAGER";
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

  async function handleCreateTask(stageId: number) {
    if (!project) {
      return;
    }

    const draft = getTaskDraft(taskDrafts, stageId);
    const title = draft.title.trim();

    if (!title) {
      return;
    }

    setError("");
    setCreatingTaskStageId(stageId);

    try {
      const createdTask = await createTask({
        title,
        description: draft.description.trim() || null,
        priority: draft.priority,
        dueDate: draft.dueDate ? new Date(draft.dueDate).toISOString() : null,
        stageId,
        assigneeId: draft.assigneeId ? Number(draft.assigneeId) : null,
      });

      setProject({
        ...project,
        stages: project.stages.map((stage) =>
          stage.id === stageId ? { ...stage, tasks: [...stage.tasks, createdTask] } : stage,
        ),
      });
      setTaskDrafts((currentDrafts) => ({
        ...currentDrafts,
        [stageId]: createEmptyTaskDraft(),
      }));
    } catch (taskError) {
      setError(getProjectErrorMessage(taskError));
    } finally {
      setCreatingTaskStageId(null);
    }
  }

  function updateTaskDraft(stageId: number, draft: Partial<TaskDraft>) {
    setTaskDrafts((currentDrafts) => ({
      ...currentDrafts,
      [stageId]: {
        ...getTaskDraft(currentDrafts, stageId),
        ...draft,
      },
    }));
  }

  async function handleUpdateTaskStatus(task: ProjectTask, status: TaskStatus) {
    if (!project) {
      return;
    }

    setError("");
    setUpdatingTaskId(task.id);

    try {
      const updatedTask = await updateTaskStatus(task.id, status);
      setProject({
        ...project,
        stages: project.stages.map((stage) => ({
          ...stage,
          tasks: stage.tasks.map((stageTask) =>
            stageTask.id === updatedTask.id ? updatedTask : stageTask,
          ),
        })),
      });
    } catch (taskError) {
      setError(getProjectErrorMessage(taskError));
    } finally {
      setUpdatingTaskId(null);
    }
  }

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
                    <TaskCard
                      canUpdateStatus={canUpdateTaskStatus(task, user)}
                      isUpdating={updatingTaskId === task.id}
                      key={task.id}
                      onUpdateStatus={(status) => handleUpdateTaskStatus(task, status)}
                      task={task}
                    />
                  ))}
                </div>
              ) : (
                <p className="muted">No tasks in this stage.</p>
              )}

              {canCreateTask ? (
                <TaskCreateForm
                  isSubmitting={creatingTaskStageId === stage.id}
                  members={project.users}
                  onChange={(draft) => updateTaskDraft(stage.id, draft)}
                  onSubmit={() => handleCreateTask(stage.id)}
                  stage={stage}
                  value={getTaskDraft(taskDrafts, stage.id)}
                />
              ) : null}
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

type TaskDraft = {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  assigneeId: string;
};

function TaskCreateForm({
  isSubmitting,
  members,
  onChange,
  onSubmit,
  stage,
  value,
}: {
  isSubmitting: boolean;
  members: Project["users"];
  onChange: (draft: Partial<TaskDraft>) => void;
  onSubmit: () => void;
  stage: ProjectStage;
  value: TaskDraft;
}) {
  const handleSubmit: ComponentProps<"form">["onSubmit"] = (event) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="task-create-form" onSubmit={handleSubmit}>
      <label>
        Task title
        <input
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder={`Task for ${stage.name}`}
          value={value.title}
        />
      </label>

      <label>
        Description
        <input
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="Optional details"
          value={value.description}
        />
      </label>

      <div className="task-form-grid">
        <label>
          Priority
          <select
            onChange={(event) => onChange({ priority: event.target.value as TaskPriority })}
            value={value.priority}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </label>

        <label>
          Due date
          <input
            onChange={(event) => onChange({ dueDate: event.target.value })}
            type="date"
            value={value.dueDate}
          />
        </label>
      </div>

      <label>
        Assignee
        <select
          onChange={(event) => onChange({ assigneeId: event.target.value })}
          value={value.assigneeId}
        >
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.user.email} ({member.user.role})
            </option>
          ))}
        </select>
      </label>

      <button disabled={isSubmitting || !value.title.trim()} type="submit">
        {isSubmitting ? "Creating..." : "Add task"}
      </button>
    </form>
  );
}

function TaskCard({
  canUpdateStatus,
  isUpdating,
  onUpdateStatus,
  task,
}: {
  canUpdateStatus: boolean;
  isUpdating: boolean;
  onUpdateStatus: (status: TaskStatus) => void;
  task: ProjectTask;
}) {
  const nextStatuses = getNextStatuses(task.status);

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

      {canUpdateStatus && nextStatuses.length > 0 ? (
        <div className="task-actions">
          {nextStatuses.map((status) => (
            <button
              disabled={isUpdating}
              key={status}
              onClick={() => onUpdateStatus(status)}
              type="button"
            >
              {getStatusActionLabel(status)}
            </button>
          ))}
        </div>
      ) : null}
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

function createEmptyTaskDraft(): TaskDraft {
  return {
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
    assigneeId: "",
  };
}

function getTaskDraft(drafts: Record<number, TaskDraft>, stageId: number) {
  return drafts[stageId] ?? createEmptyTaskDraft();
}

function canUpdateTaskStatus(task: ProjectTask, user: { id: number; role: string } | null) {
  if (!user) {
    return false;
  }

  if (user.role === "ADMIN" || user.role === "MANAGER") {
    return true;
  }

  return user.role === "WORKER" && task.assigneeId === user.id;
}

function getNextStatuses(status: TaskStatus): TaskStatus[] {
  if (status === "NEW") {
    return ["IN_PROGRESS", "DONE"];
  }

  if (status === "IN_PROGRESS") {
    return ["DONE"];
  }

  return [];
}

function getStatusActionLabel(status: TaskStatus) {
  if (status === "IN_PROGRESS") {
    return "Start";
  }

  if (status === "DONE") {
    return "Mark done";
  }

  return status;
}
