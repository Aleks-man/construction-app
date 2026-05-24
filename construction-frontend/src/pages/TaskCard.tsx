import { useState, type ComponentProps } from "react";
import type { Project, ProjectTask, TaskPriority, TaskStatus } from "../api/projects";
import { formatDate, getNextStatuses, getStatusActionLabel } from "./project-details-utils";

export function TaskCard({
  canManageTask,
  canUpdateStatus,
  isDeleting,
  isSaving,
  isUpdating,
  members,
  onDeleteTask,
  onUpdateTask,
  onUpdateStatus,
  task,
}: {
  canManageTask: boolean;
  canUpdateStatus: boolean;
  isDeleting: boolean;
  isSaving: boolean;
  isUpdating: boolean;
  members: Project["users"];
  onDeleteTask: (task: ProjectTask) => Promise<boolean>;
  onUpdateTask: (task: ProjectTask, draft: TaskEditDraft) => Promise<boolean>;
  onUpdateStatus: (status: TaskStatus) => void;
  task: ProjectTask;
}) {
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [taskDraft, setTaskDraft] = useState<TaskEditDraft>(() => createTaskEditDraft(task));
  const nextStatuses = getNextStatuses(task.status);

  const handleUpdateTask: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();

    const isUpdated = await onUpdateTask(task, taskDraft);

    if (isUpdated) {
      setIsEditingTask(false);
    }
  };

  async function handleDeleteTask() {
    const isDeleted = await onDeleteTask(task);

    if (isDeleted) {
      setIsConfirmingDelete(false);
    }
  }

  return (
    <article className="task-card">
      {isEditingTask ? (
        <form className="task-edit-form" onSubmit={handleUpdateTask}>
          <label>
            Task title
            <input
              autoFocus
              onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })}
              value={taskDraft.title}
            />
          </label>

          <label>
            Description
            <input
              onChange={(event) =>
                setTaskDraft({ ...taskDraft, description: event.target.value })
              }
              placeholder="Optional details"
              value={taskDraft.description}
            />
          </label>

          <div className="task-form-grid">
            <label>
              Priority
              <select
                onChange={(event) =>
                  setTaskDraft({ ...taskDraft, priority: event.target.value as TaskPriority })
                }
                value={taskDraft.priority}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </label>

            <label>
              Due date
              <input
                onChange={(event) => setTaskDraft({ ...taskDraft, dueDate: event.target.value })}
                type="date"
                value={taskDraft.dueDate}
              />
            </label>
          </div>

          <label>
            Assignee
            <select
              onChange={(event) => setTaskDraft({ ...taskDraft, assigneeId: event.target.value })}
              value={taskDraft.assigneeId}
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.user.email} ({member.user.role})
                </option>
              ))}
            </select>
          </label>

          <div className="compact-actions">
            <button
              className="secondary-button"
              disabled={isSaving}
              onClick={() => {
                setTaskDraft(createTaskEditDraft(task));
                setIsEditingTask(false);
              }}
              type="button"
            >
              Cancel
            </button>
            <button disabled={isSaving || !taskDraft.title.trim()} type="submit">
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="task-card-header">
            <h3>{task.title}</h3>
            <span className={`status-pill status-${task.status.toLowerCase()}`}>
              {task.status}
            </span>
          </div>

          {task.description ? <p className="muted">{task.description}</p> : null}

          <div className="task-meta">
            <span>{task.priority}</span>
            <span>{task.dueDate ? formatDate(task.dueDate) : "No due date"}</span>
            <span>{getAssigneeLabel(task, members)}</span>
          </div>
        </>
      )}

      {isConfirmingDelete ? (
        <div className="task-delete-confirm">
          <p className="muted">Delete this task permanently?</p>
          <div className="compact-actions">
            <button
              className="secondary-button"
              disabled={isDeleting}
              onClick={() => setIsConfirmingDelete(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="danger-button"
              disabled={isDeleting}
              onClick={handleDeleteTask}
              type="button"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      ) : null}

      {canManageTask && !isEditingTask ? (
        <div className="task-actions">
          <button
            onClick={() => {
              setTaskDraft(createTaskEditDraft(task));
              setIsEditingTask(true);
              setIsConfirmingDelete(false);
            }}
            type="button"
          >
            Edit
          </button>
          <button
            className="danger-action-button"
            disabled={isDeleting}
            onClick={() => {
              setIsConfirmingDelete(true);
              setIsEditingTask(false);
            }}
            type="button"
          >
            Delete
          </button>
        </div>
      ) : null}

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

export type TaskEditDraft = {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  assigneeId: string;
};

function createTaskEditDraft(task: ProjectTask): TaskEditDraft {
  return {
    title: task.title,
    description: task.description ?? "",
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    assigneeId: task.assigneeId ? String(task.assigneeId) : "",
  };
}

function getAssigneeLabel(task: ProjectTask, members: Project["users"]) {
  if (!task.assigneeId) {
    return "Unassigned";
  }

  const assignee = members.find((member) => member.userId === task.assigneeId);

  return assignee ? assignee.user.email : `User #${task.assigneeId}`;
}
