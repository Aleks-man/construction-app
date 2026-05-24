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
  isCreatingTask,
  members,
  onCreateTask,
  onTaskDraftChange,
  onUpdateTaskStatus,
  priorityFilter,
  stage,
  statusFilter,
  taskDraft,
  updatingTaskId,
  user,
}: {
  canCreateTask: boolean;
  isCreatingTask: boolean;
  members: Project["users"];
  onCreateTask: () => void;
  onTaskDraftChange: (draft: Partial<TaskDraft>) => void;
  onUpdateTaskStatus: (task: ProjectTask, status: TaskStatus) => void;
  priorityFilter: TaskPriority | "ALL";
  stage: ProjectStage;
  statusFilter: TaskStatus | "ALL";
  taskDraft: TaskDraft;
  updatingTaskId: number | null;
  user: { id: number; role: string } | null;
}) {
  const visibleStageTasks = filterTasks(stage.tasks, statusFilter, priorityFilter);

  return (
    <article className="stage-column">
      <div className="stage-header">
        <h2>{stage.name}</h2>
        <span className="counter-badge">{visibleStageTasks.length}</span>
      </div>

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
