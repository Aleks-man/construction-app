import type { ProjectTask, TaskStatus } from "../api/projects";
import { formatDate, getNextStatuses, getStatusActionLabel } from "./project-details-utils";

export function TaskCard({
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
