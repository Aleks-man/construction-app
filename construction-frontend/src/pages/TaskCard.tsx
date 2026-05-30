import { useState, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import type { Project, ProjectTask, TaskPriority, TaskStatus } from "../api/projects";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { getUserDisplayName } from "../utils/user-display";
import { formatDate, getNextStatuses } from "./project-details-utils";

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
  const { i18n, t } = useTranslation();
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
            {t("tasks.title")}
            <input
              autoFocus
              onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })}
              value={taskDraft.title}
            />
          </label>

          <label>
            {t("tasks.description")}
            <input
              onChange={(event) =>
                setTaskDraft({ ...taskDraft, description: event.target.value })
              }
              placeholder={t("tasks.descriptionPlaceholder")}
              value={taskDraft.description}
            />
          </label>

          <div className="task-form-grid">
            <label>
              {t("tasks.priority")}
              <select
                onChange={(event) =>
                  setTaskDraft({ ...taskDraft, priority: event.target.value as TaskPriority })
                }
                value={taskDraft.priority}
              >
                <option value="LOW">{t("priorities.LOW")}</option>
                <option value="MEDIUM">{t("priorities.MEDIUM")}</option>
                <option value="HIGH">{t("priorities.HIGH")}</option>
              </select>
            </label>

            <label>
              {t("tasks.dueDate")}
              <input
                onChange={(event) => setTaskDraft({ ...taskDraft, dueDate: event.target.value })}
                type="date"
                value={taskDraft.dueDate}
              />
            </label>
          </div>

          <label>
            {t("tasks.assignee")}
            <select
              onChange={(event) => setTaskDraft({ ...taskDraft, assigneeId: event.target.value })}
              value={taskDraft.assigneeId}
            >
              <option value="">{t("common.unassigned")}</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {getUserDisplayName(member.user)} ({t(`roles.${member.user.role}`)})
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
              {t("common.cancel")}
            </button>
            <button disabled={isSaving || !taskDraft.title.trim()} type="submit">
              {isSaving ? t("common.saving") : t("common.save")}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="task-card-header">
            <h3>{task.title}</h3>
            <span className={`status-pill status-${task.status.toLowerCase()}`}>
              {t(`statuses.${task.status}`)}
            </span>
          </div>

          {task.description ? <p className="muted">{task.description}</p> : null}

          <div className="task-meta">
            <span>{t(`priorities.${task.priority}`)}</span>
            <span>{task.dueDate ? formatDate(task.dueDate, i18n.language) : t("tasks.noDueDate")}</span>
            <span>{getAssigneeLabel(task, members, t("common.unassigned"))}</span>
          </div>
        </>
      )}

      <ConfirmDialog
        cancelLabel={t("common.cancel")}
        confirmLabel={t("common.delete")}
        confirmingLabel={t("common.deleting")}
        isConfirming={isDeleting}
        isOpen={isConfirmingDelete}
        message={t("tasks.deleteConfirm")}
        onCancel={() => setIsConfirmingDelete(false)}
        onConfirm={handleDeleteTask}
        title={t("tasks.deleteTitle")}
      />

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
            {t("common.edit")}
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
            {t("common.delete")}
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
              {t(`statusActions.${status}`)}
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

function getAssigneeLabel(task: ProjectTask, members: Project["users"], unassignedLabel: string) {
  if (!task.assigneeId) {
    return unassignedLabel;
  }

  const assignee = members.find((member) => member.userId === task.assigneeId);

  return assignee ? getUserDisplayName(assignee.user) : `User #${task.assigneeId}`;
}
