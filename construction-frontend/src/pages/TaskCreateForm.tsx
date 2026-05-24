import type { ComponentProps } from "react";
import type { Project, ProjectStage, TaskPriority } from "../api/projects";
import type { TaskDraft } from "./project-details-utils";

export function TaskCreateForm({
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
