import { useState, type ComponentProps } from "react";
import type { Project, ProjectStage, ProjectTask, TaskPriority, TaskStatus } from "../api/projects";
import {
  canUpdateTaskStatus,
  filterTasks,
  type TaskDraft,
} from "./project-details-utils";
import { TaskCard } from "./TaskCard";
import { TaskCreateForm } from "./TaskCreateForm";

export function StageColumn({
  canCreateTask,
  canManageStage,
  deletingStageId,
  isCreatingTask,
  onDeleteStage,
  members,
  onCreateTask,
  onTaskDraftChange,
  onUpdateTaskStatus,
  onUpdateStageName,
  priorityFilter,
  stage,
  statusFilter,
  taskDraft,
  updatingStageId,
  updatingTaskId,
  user,
}: {
  canCreateTask: boolean;
  canManageStage: boolean;
  deletingStageId: number | null;
  isCreatingTask: boolean;
  members: Project["users"];
  onCreateTask: () => void;
  onDeleteStage: (stageId: number) => Promise<boolean>;
  onTaskDraftChange: (draft: Partial<TaskDraft>) => void;
  onUpdateTaskStatus: (task: ProjectTask, status: TaskStatus) => void;
  onUpdateStageName: (stageId: number, name: string) => Promise<boolean>;
  priorityFilter: TaskPriority | "ALL";
  stage: ProjectStage;
  statusFilter: TaskStatus | "ALL";
  taskDraft: TaskDraft;
  updatingStageId: number | null;
  updatingTaskId: number | null;
  user: { id: number; role: string } | null;
}) {
  const [isEditingStageName, setIsEditingStageName] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [stageNameDraft, setStageNameDraft] = useState(stage.name);
  const visibleStageTasks = filterTasks(stage.tasks, statusFilter, priorityFilter);
  const isUpdatingStage = updatingStageId === stage.id;
  const isDeletingStage = deletingStageId === stage.id;

  const handleUpdateStageName: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();

    const name = stageNameDraft.trim();

    if (!name || name === stage.name) {
      setStageNameDraft(stage.name);
      setIsEditingStageName(false);
      return;
    }

    const isUpdated = await onUpdateStageName(stage.id, name);

    if (isUpdated) {
      setIsEditingStageName(false);
    }
  };

  async function handleDeleteStage() {
    const isDeleted = await onDeleteStage(stage.id);

    if (isDeleted) {
      setIsConfirmingDelete(false);
    }
  }

  return (
    <article className="stage-column">
      <div className="stage-header">
        {isEditingStageName ? (
          <form className="stage-edit-form" onSubmit={handleUpdateStageName}>
            <label>
              Stage name
              <input
                autoFocus
                onChange={(event) => setStageNameDraft(event.target.value)}
                value={stageNameDraft}
              />
            </label>
            <div className="compact-actions">
              <button
                className="secondary-button"
                disabled={isUpdatingStage}
                onClick={() => {
                  setStageNameDraft(stage.name);
                  setIsEditingStageName(false);
                }}
                type="button"
              >
                Cancel
              </button>
              <button disabled={isUpdatingStage || !stageNameDraft.trim()} type="submit">
                {isUpdatingStage ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div>
              <h2>{stage.name}</h2>
              {canManageStage ? (
                <div className="stage-actions">
                  <button
                    className="text-button"
                    onClick={() => {
                      setStageNameDraft(stage.name);
                      setIsEditingStageName(true);
                    }}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="text-button danger-text-button"
                    disabled={isDeletingStage}
                    onClick={() => setIsConfirmingDelete(true)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
            <span className="counter-badge">{visibleStageTasks.length}</span>
          </>
        )}
      </div>

      {isConfirmingDelete ? (
        <div className="stage-delete-confirm">
          <p className="muted">Delete this stage and all its tasks?</p>
          <div className="compact-actions">
            <button
              className="secondary-button"
              disabled={isDeletingStage}
              onClick={() => setIsConfirmingDelete(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="danger-button"
              disabled={isDeletingStage}
              onClick={handleDeleteStage}
              type="button"
            >
              {isDeletingStage ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      ) : null}

      {visibleStageTasks.length > 0 ? (
        <div className="tasks-list">
          {visibleStageTasks.map((task) => (
            <TaskCard
              canUpdateStatus={canUpdateTaskStatus(task, user)}
              isUpdating={updatingTaskId === task.id}
              key={task.id}
              onUpdateStatus={(status) => onUpdateTaskStatus(task, status)}
              task={task}
            />
          ))}
        </div>
      ) : (
        <p className="muted">
          {stage.tasks.length > 0 ? "No tasks match the filters." : "No tasks in this stage."}
        </p>
      )}

      {canCreateTask ? (
        <TaskCreateForm
          isSubmitting={isCreatingTask}
          members={members}
          onChange={onTaskDraftChange}
          onSubmit={onCreateTask}
          stage={stage}
          value={taskDraft}
        />
      ) : null}
    </article>
  );
}
