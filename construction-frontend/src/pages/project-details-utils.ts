import type { ProjectTask, TaskPriority, TaskStatus } from "../api/projects";

export type TaskDraft = {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  assigneeId: string;
};

export function createEmptyTaskDraft(): TaskDraft {
  return {
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
    assigneeId: "",
  };
}

export function getTaskDraft(drafts: Record<number, TaskDraft>, stageId: number) {
  return drafts[stageId] ?? createEmptyTaskDraft();
}

export function canUpdateTaskStatus(
  task: ProjectTask,
  user: { id: number; role: string } | null,
) {
  if (!user) {
    return false;
  }

  if (user.role === "ADMIN" || user.role === "MANAGER") {
    return true;
  }

  return user.role === "WORKER" && task.assigneeId === user.id;
}

export function getNextStatuses(status: TaskStatus): TaskStatus[] {
  if (status === "NEW") {
    return ["IN_PROGRESS", "DONE"];
  }

  if (status === "IN_PROGRESS") {
    return ["DONE"];
  }

  return [];
}

export function getStatusActionLabel(status: TaskStatus) {
  if (status === "IN_PROGRESS") {
    return "Start";
  }

  if (status === "DONE") {
    return "Mark done";
  }

  return status;
}

export function filterTasks(
  tasks: ProjectTask[],
  statusFilter: TaskStatus | "ALL",
  priorityFilter: TaskPriority | "ALL",
) {
  return tasks.filter((task) => {
    const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || task.priority === priorityFilter;

    return matchesStatus && matchesPriority;
  });
}

export function getTaskSummary(tasks: ProjectTask[]) {
  return tasks.reduce(
    (summary, task) => ({
      ...summary,
      [task.status]: summary[task.status] + 1,
      HIGH: task.priority === "HIGH" ? summary.HIGH + 1 : summary.HIGH,
    }),
    {
      NEW: 0,
      IN_PROGRESS: 0,
      DONE: 0,
      HIGH: 0,
    },
  );
}

export function formatDate(date: string, language = "en") {
  return new Intl.DateTimeFormat(language, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
