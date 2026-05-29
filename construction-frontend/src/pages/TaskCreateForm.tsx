import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const handleSubmit: ComponentProps<"form">["onSubmit"] = (event) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="task-create-form" onSubmit={handleSubmit}>
      <label>
        {t("tasks.title")}
        <input
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder={t("tasks.createPlaceholder", { stage: stage.name })}
          value={value.title}
        />
      </label>

      <label>
        {t("tasks.description")}
        <input
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder={t("tasks.descriptionPlaceholder")}
          value={value.description}
        />
      </label>

      <div className="task-form-grid">
        <label>
          {t("tasks.priority")}
          <select
            onChange={(event) => onChange({ priority: event.target.value as TaskPriority })}
            value={value.priority}
          >
            <option value="LOW">{t("priorities.LOW")}</option>
            <option value="MEDIUM">{t("priorities.MEDIUM")}</option>
            <option value="HIGH">{t("priorities.HIGH")}</option>
          </select>
        </label>

        <label>
          {t("tasks.dueDate")}
          <input
            onChange={(event) => onChange({ dueDate: event.target.value })}
            type="date"
            value={value.dueDate}
          />
        </label>
      </div>

      <label>
        {t("tasks.assignee")}
        <select
          onChange={(event) => onChange({ assigneeId: event.target.value })}
          value={value.assigneeId}
        >
          <option value="">{t("common.unassigned")}</option>
          {members.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.user.email} ({t(`roles.${member.user.role}`)})
            </option>
          ))}
        </select>
      </label>

      <button disabled={isSubmitting || !value.title.trim()} type="submit">
        {isSubmitting ? t("common.creating") : t("tasks.addTask")}
      </button>
    </form>
  );
}
