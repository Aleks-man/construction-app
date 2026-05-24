import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/client";
import { getTasks, updateTaskStatus, type TaskWithDetails } from "../api/tasks";
import type { TaskPriority, TaskStatus } from "../api/projects";
import { useAuth } from "../auth/auth-context";
import { EmptyState, ErrorState, LoadingState } from "../components/StateView";
import {
  canUpdateTaskStatus,
  formatDate,
  getNextStatuses,
  getStatusActionLabel,
  getTaskSummary,
} from "./project-details-utils";

export function MyTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "ALL">("ALL");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const isWorker = user?.role === "WORKER";

  useEffect(() => {
    let isMounted = true;

    async function loadTasks() {
      if (!user) {
        return;
      }

      setError("");
      setIsLoading(true);

      try {
        const tasksResponse = await getTasks({
          assigneeId: isWorker ? user.id : undefined,
          priority: priorityFilter,
          status: statusFilter,
        });

        if (isMounted) {
          setTasks(tasksResponse);
        }
      } catch (tasksError) {
        if (isMounted) {
          setError(getTasksErrorMessage(tasksError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTasks();

    return () => {
      isMounted = false;
    };
  }, [isWorker, priorityFilter, statusFilter, user]);

  async function handleUpdateTaskStatus(task: TaskWithDetails, status: TaskStatus) {
    setError("");
    setUpdatingTaskId(task.id);

    try {
      const updatedTask = await updateTaskStatus(task.id, status);
      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === updatedTask.id ? { ...currentTask, ...updatedTask } : currentTask,
        ),
      );
    } catch (taskError) {
      setError(getTasksErrorMessage(taskError));
    } finally {
      setUpdatingTaskId(null);
    }
  }

  const taskSummary = useMemo(() => getTaskSummary(tasks), [tasks]);
  const dueSoonCount = useMemo(() => tasks.filter(isDueSoon).length, [tasks]);
  const overdueCount = useMemo(() => tasks.filter(isOverdue).length, [tasks]);

  return (
    <main className="app-shell">
      <header className="page-heading">
        <p className="eyebrow">Tasks</p>
        <h1>{isWorker ? "My tasks" : "Team tasks"}</h1>
        <p className="muted">
          {isWorker
            ? "Track assigned work and update task progress."
            : "Review active work across projects and follow delivery risks."}
        </p>
      </header>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Work overview</h2>
            <p className="muted">Scan task status, priority and upcoming due dates.</p>
          </div>
          <span className="counter-badge">{tasks.length}</span>
        </div>

        <dl className="task-summary-grid">
          <div>
            <dt>New</dt>
            <dd>{taskSummary.NEW}</dd>
          </div>
          <div>
            <dt>In progress</dt>
            <dd>{taskSummary.IN_PROGRESS}</dd>
          </div>
          <div>
            <dt>High priority</dt>
            <dd>{taskSummary.HIGH}</dd>
          </div>
          <div>
            <dt>Due soon</dt>
            <dd>{dueSoonCount}</dd>
          </div>
          <div>
            <dt>Overdue</dt>
            <dd>{overdueCount}</dd>
          </div>
        </dl>

        <div className="filters-row">
          <label>
            Status
            <select
              onChange={(event) => setStatusFilter(event.target.value as TaskStatus | "ALL")}
              value={statusFilter}
            >
              <option value="ALL">All statuses</option>
              <option value="NEW">New</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="DONE">Done</option>
            </select>
          </label>

          <label>
            Priority
            <select
              onChange={(event) => setPriorityFilter(event.target.value as TaskPriority | "ALL")}
              value={priorityFilter}
            >
              <option value="ALL">All priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </label>
        </div>
      </section>

      {error ? <ErrorState message={error} title="Tasks unavailable" /> : null}

      <section className="tasks-board">
        {isLoading ? <LoadingState message="Loading tasks..." /> : null}

        {!isLoading && !error && tasks.length === 0 ? (
          <EmptyState
            message={
              isWorker
                ? "No assigned tasks match the current filters."
                : "No team tasks match the current filters."
            }
            title="No tasks found"
          />
        ) : null}

        {!isLoading && tasks.length > 0 ? (
          <div className="task-table">
            {tasks.map((task) => (
              <article className="task-row" key={task.id}>
                <div>
                  <div className="task-row-title">
                    <h2>{task.title}</h2>
                    <span className={`status-pill status-${task.status.toLowerCase()}`}>
                      {task.status}
                    </span>
                  </div>
                  {task.description ? <p className="muted">{task.description}</p> : null}
                  <div className="task-meta">
                    <span>{task.priority}</span>
                    <span>{task.dueDate ? formatDate(task.dueDate) : "No due date"}</span>
                    <span>{task.assignee ? task.assignee.email : "Unassigned"}</span>
                  </div>
                </div>

                <div className="task-context">
                  <Link className="text-link" to={`/projects/${task.stage.project.id}`}>
                    {task.stage.project.name}
                  </Link>
                  <span>{task.stage.name}</span>
                </div>

                {canUpdateTaskStatus(task, user) ? (
                  <div className="task-actions">
                    {getNextStatuses(task.status).map((status) => (
                      <button
                        disabled={updatingTaskId === task.id}
                        key={status}
                        onClick={() => handleUpdateTaskStatus(task, status)}
                        type="button"
                      >
                        {updatingTaskId === task.id ? "Updating..." : getStatusActionLabel(status)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function getTasksErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Unable to load tasks";
}

function isOverdue(task: TaskWithDetails) {
  if (!task.dueDate || task.status === "DONE") {
    return false;
  }

  return new Date(task.dueDate) < startOfToday();
}

function isDueSoon(task: TaskWithDetails) {
  if (!task.dueDate || task.status === "DONE" || isOverdue(task)) {
    return false;
  }

  const dueDate = new Date(task.dueDate);
  const dueSoonLimit = startOfToday();
  dueSoonLimit.setDate(dueSoonLimit.getDate() + 7);

  return dueDate <= dueSoonLimit;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}
