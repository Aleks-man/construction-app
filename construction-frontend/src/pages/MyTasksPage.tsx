import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ApiError } from "../api/client";
import { getTasks, updateTaskStatus, type TaskWithDetails } from "../api/tasks";
import type { TaskPriority, TaskStatus } from "../api/projects";
import { useAuth } from "../auth/auth-context";
import { EmptyState, ErrorState, LoadingState } from "../components/StateView";
import { getUserDisplayName } from "../utils/user-display";
import {
  canMoveTaskToStatus,
  canUpdateTaskStatus,
  formatDate,
  getTaskSummary,
} from "./project-details-utils";

const taskStatusOptions: TaskStatus[] = ["NEW", "IN_PROGRESS", "DONE"];

export function MyTasksPage() {
  const { user } = useAuth();
  const { i18n, t } = useTranslation();
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
          setError(getTasksErrorMessage(tasksError, t("tasks.loadError")));
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
  }, [isWorker, priorityFilter, statusFilter, t, user]);

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
      setError(getTasksErrorMessage(taskError, t("tasks.loadError")));
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
        <p className="eyebrow">{t("tasks.eyebrow")}</p>
        <h1>{isWorker ? t("tasks.myTitle") : t("tasks.teamTitle")}</h1>
        <p className="muted">
          {isWorker ? t("tasks.myDescription") : t("tasks.teamDescription")}
        </p>
      </header>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>{t("tasks.overviewTitle")}</h2>
            <p className="muted">{t("tasks.overviewDescription")}</p>
          </div>
          <span className="counter-badge">{tasks.length}</span>
        </div>

        <dl className="task-summary-grid">
          <div>
            <dt>{t("tasks.new")}</dt>
            <dd>{taskSummary.NEW}</dd>
          </div>
          <div>
            <dt>{t("tasks.inProgress")}</dt>
            <dd>{taskSummary.IN_PROGRESS}</dd>
          </div>
          <div>
            <dt>{t("tasks.highPriority")}</dt>
            <dd>{taskSummary.HIGH}</dd>
          </div>
          <div>
            <dt>{t("tasks.dueSoon")}</dt>
            <dd>{dueSoonCount}</dd>
          </div>
          <div>
            <dt>{t("tasks.overdue")}</dt>
            <dd>{overdueCount}</dd>
          </div>
        </dl>

        <div className="filters-row">
          <label>
            {t("tasks.status")}
            <select
              onChange={(event) => setStatusFilter(event.target.value as TaskStatus | "ALL")}
              value={statusFilter}
            >
              <option value="ALL">{t("statuses.ALL")}</option>
              <option value="NEW">{t("statuses.NEW")}</option>
              <option value="IN_PROGRESS">{t("statuses.IN_PROGRESS")}</option>
              <option value="DONE">{t("statuses.DONE")}</option>
            </select>
          </label>

          <label>
            {t("tasks.priority")}
            <select
              onChange={(event) => setPriorityFilter(event.target.value as TaskPriority | "ALL")}
              value={priorityFilter}
            >
              <option value="ALL">{t("priorities.ALL")}</option>
              <option value="LOW">{t("priorities.LOW")}</option>
              <option value="MEDIUM">{t("priorities.MEDIUM")}</option>
              <option value="HIGH">{t("priorities.HIGH")}</option>
            </select>
          </label>
        </div>
      </section>

      {error ? <ErrorState message={error} title={t("tasks.unavailable")} /> : null}

      <section className="tasks-board">
        {isLoading ? <LoadingState message={t("tasks.loading")} /> : null}

        {!isLoading && !error && tasks.length === 0 ? (
          <EmptyState
            message={
              isWorker
                ? t("tasks.emptyWorker")
                : t("tasks.emptyTeam")
            }
            title={t("tasks.emptyTitle")}
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
                      {t(`statuses.${task.status}`)}
                    </span>
                  </div>
                  {task.description ? <p className="muted">{task.description}</p> : null}
                  <div className="task-meta">
                    <span>{t(`priorities.${task.priority}`)}</span>
                    <span>
                      {task.dueDate ? formatDate(task.dueDate, i18n.language) : t("tasks.noDueDate")}
                    </span>
                    <span>
                      {task.assignee ? getUserDisplayName(task.assignee) : t("common.unassigned")}
                    </span>
                  </div>
                </div>

                <div className="task-context">
                  <Link className="text-link" to={`/projects/${task.stage.project.id}`}>
                    {task.stage.project.name}
                  </Link>
                  <span>{task.stage.name}</span>
                </div>

                {user?.role !== "MANAGER" && canUpdateTaskStatus(task, user) ? (
                  <label className="status-select-control">
                    {t("tasks.status")}
                    <select
                      disabled={updatingTaskId === task.id}
                      onChange={(event) =>
                        handleUpdateTaskStatus(task, event.target.value as TaskStatus)
                      }
                      value={task.status}
                    >
                      {taskStatusOptions.map((status) => (
                        <option disabled={!canMoveTaskToStatus(task, status)} key={status} value={status}>
                          {t(`statuses.${status}`)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function getTasksErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
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
