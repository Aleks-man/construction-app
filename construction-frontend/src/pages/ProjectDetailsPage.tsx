import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ApiError } from "../api/client";
import { addProjectUser, removeProjectUser } from "../api/project-users";
import {
  deleteProject,
  getProjectActivity,
  getProjectById,
  updateProject,
  type Project,
  type ProjectActivityLog,
  type ProjectTask,
  type TaskPriority,
  type TaskStatus,
} from "../api/projects";
import { createStage, deleteStage, updateStage } from "../api/stages";
import { createTask, deleteTask, updateTask, updateTaskStatus } from "../api/tasks";
import { createUser, getUsers, type AppUser, type UserRole } from "../api/users";
import { useAuth } from "../auth/auth-context";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PasswordInput } from "../components/PasswordInput";
import { PencilIcon } from "../components/PencilIcon";
import { EmptyState, ErrorState, LoadingState } from "../components/StateView";
import { isValidOptionalPhone } from "../utils/phone";
import { getUserDisplayName } from "../utils/user-display";
import { StageColumn } from "./StageColumn";
import type { TaskEditDraft } from "./TaskCard";
import {
  createEmptyTaskDraft,
  filterTasks,
  formatDate,
  getTaskDraft,
  getTaskSummary,
  isValidTaskDueDateInputValue,
  type TaskDraft,
} from "./project-details-utils";

export function ProjectDetailsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { i18n, t } = useTranslation();
  const [project, setProject] = useState<Project | null>(null);
  const [activityLogs, setActivityLogs] = useState<ProjectActivityLog[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [stageName, setStageName] = useState("");
  const [projectNameDraft, setProjectNameDraft] = useState("");
  const [taskDrafts, setTaskDrafts] = useState<Record<number, TaskDraft>>({});
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [newUserDraft, setNewUserDraft] = useState<UserDraft>(createEmptyUserDraft());
  const [isNewUserPhoneTouched, setIsNewUserPhoneTouched] = useState(false);
  const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<TaskPriority | "ALL">("ALL");
  const [error, setError] = useState("");
  const [projectLoadError, setProjectLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<Project["users"][number] | null>(null);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [isUpdatingProjectName, setIsUpdatingProjectName] = useState(false);
  const [isCreatingStage, setIsCreatingStage] = useState(false);
  const [updatingStageId, setUpdatingStageId] = useState<number | null>(null);
  const [deletingStageId, setDeletingStageId] = useState<number | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [creatingTaskStageId, setCreatingTaskStageId] = useState<number | null>(null);
  const [savingTaskId, setSavingTaskId] = useState<number | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
  const canDeleteProject = user?.role === "ADMIN";
  const canCreateUsers = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canSelectNewUserRole = user?.role === "ADMIN";
  const parsedProjectId = useMemo(() => Number(projectId), [projectId]);

  useEffect(() => {
    let isMounted = true;

    async function loadProject() {
      if (!Number.isInteger(parsedProjectId) || parsedProjectId <= 0) {
        setProjectLoadError(t("projectDetails.invalidId"));
        setIsLoading(false);
        return;
      }

      try {
        const [projectResponse, activityResponse] = await Promise.all([
          getProjectById(parsedProjectId),
          getProjectActivity(parsedProjectId),
        ]);

        if (isMounted) {
          setProject(projectResponse);
          setActivityLogs(activityResponse);
        }
      } catch (projectError) {
        if (isMounted) {
          setProjectLoadError(getProjectErrorMessage(projectError, t("projectDetails.unavailableMessage")));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      isMounted = false;
    };
  }, [parsedProjectId, t]);

  async function refreshProjectActivity(projectIdToRefresh: number) {
    setIsLoadingActivity(true);

    try {
      const activityResponse = await getProjectActivity(projectIdToRefresh);
      setActivityLogs(activityResponse);
    } catch (activityError) {
      setError(getProjectErrorMessage(activityError, t("projectDetails.unavailableMessage")));
    } finally {
      setIsLoadingActivity(false);
    }
  }

  useEffect(() => {
    if (project && !isEditingProjectName) {
      setProjectNameDraft(project.name);
    }
  }, [isEditingProjectName, project]);

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      if (!canCreateUsers) {
        return;
      }

      setIsLoadingUsers(true);

      try {
        const usersResponse = await getUsers();

        if (isMounted) {
          setUsers(usersResponse);
        }
      } catch (usersError) {
        if (isMounted) {
          setError(getProjectErrorMessage(usersError, t("users.loadError")));
        }
      } finally {
        if (isMounted) {
          setIsLoadingUsers(false);
        }
      }
    }

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, [canCreateUsers, t]);

  const handleCreateStage: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();

    if (!project) {
      return;
    }

    const name = stageName.trim();

    if (!name) {
      return;
    }

    setError("");
    setIsCreatingStage(true);

    try {
      const createdStage = await createStage({ name, projectId: project.id });
      setProject({
        ...project,
        stages: [...project.stages, createdStage],
      });
      setStageName("");
      await refreshProjectActivity(project.id);
    } catch (stageError) {
      setError(getProjectErrorMessage(stageError, t("projectDetails.unavailableMessage")));
    } finally {
      setIsCreatingStage(false);
    }
  };

  async function handleCreateTask(stageId: number) {
    if (!project) {
      return;
    }

    const draft = getTaskDraft(taskDrafts, stageId);
    const title = draft.title.trim();

    if (!title || !isValidTaskDueDateInputValue(draft.dueDate)) {
      return;
    }

    setError("");
    setCreatingTaskStageId(stageId);

    try {
      const createdTask = await createTask({
        title,
        description: draft.description.trim() || null,
        priority: draft.priority,
        dueDate: draft.dueDate ? new Date(draft.dueDate).toISOString() : null,
        stageId,
        assigneeId: draft.assigneeId ? Number(draft.assigneeId) : null,
      });

      setProject({
        ...project,
        stages: project.stages.map((stage) =>
          stage.id === stageId ? { ...stage, tasks: [...stage.tasks, createdTask] } : stage,
        ),
      });
      setTaskDrafts((currentDrafts) => ({
        ...currentDrafts,
        [stageId]: createEmptyTaskDraft(),
      }));
      await refreshProjectActivity(project.id);
    } catch (taskError) {
      setError(getProjectErrorMessage(taskError, t("tasks.loadError")));
    } finally {
      setCreatingTaskStageId(null);
    }
  }

  function updateTaskDraft(stageId: number, draft: Partial<TaskDraft>) {
    setTaskDrafts((currentDrafts) => ({
      ...currentDrafts,
      [stageId]: {
        ...getTaskDraft(currentDrafts, stageId),
        ...draft,
      },
    }));
  }

  const handleCreateUser: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();

    const email = newUserDraft.email.trim();
    const password = newUserDraft.password.trim();
    const firstName = newUserDraft.firstName.trim();
  const lastName = newUserDraft.lastName.trim();

    setIsNewUserPhoneTouched(true);

    if (!firstName || !lastName || !email || !password) {
      return;
    }

    if (!isValidOptionalPhone(newUserDraft.phone)) {
      return;
    }

    setError("");
    setIsCreatingUser(true);

    try {
      const createdUser = await createUser({
        email,
        password,
        firstName,
        lastName,
        phone: newUserDraft.phone.trim() || null,
        role: canSelectNewUserRole ? newUserDraft.role : "WORKER",
      });
      setUsers((currentUsers) => [createdUser, ...currentUsers]);
      setSelectedMemberId(String(createdUser.id));
      setNewUserDraft(createEmptyUserDraft());
      setIsNewUserPhoneTouched(false);
    } catch (userError) {
      setError(getProjectErrorMessage(userError, t("users.loadError")));
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleAddMember: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();

    if (!project || !selectedMemberId) {
      return;
    }

    setError("");
    setIsAddingMember(true);

    try {
      const addedMember = await addProjectUser({
        projectId: project.id,
        userId: Number(selectedMemberId),
      });
      setProject({
        ...project,
        users: [...project.users, addedMember],
      });
      setSelectedMemberId("");
      await refreshProjectActivity(project.id);
    } catch (memberError) {
      setError(getProjectErrorMessage(memberError, t("projectDetails.unavailableMessage")));
    } finally {
      setIsAddingMember(false);
    }
  };

  async function handleRemoveMember() {
    if (!project || !memberToRemove) {
      return;
    }

    setError("");
    setRemovingMemberId(memberToRemove.userId);

    try {
      await removeProjectUser(project.id, memberToRemove.userId);
      setProject({
        ...project,
        users: project.users.filter((member) => member.userId !== memberToRemove.userId),
      });
      setMemberToRemove(null);
      await refreshProjectActivity(project.id);
    } catch (memberError) {
      setError(getProjectErrorMessage(memberError, t("projectDetails.unavailableMessage")));
    } finally {
      setRemovingMemberId(null);
    }
  }

  async function handleUpdateTaskStatus(task: ProjectTask, status: TaskStatus) {
    if (!project) {
      return;
    }

    setError("");
    setUpdatingTaskId(task.id);

    try {
      const updatedTask = await updateTaskStatus(task.id, status);
      setProject({
        ...project,
        stages: project.stages.map((stage) => ({
          ...stage,
          tasks: stage.tasks.map((stageTask) =>
            stageTask.id === updatedTask.id ? updatedTask : stageTask,
          ),
        })),
      });
      await refreshProjectActivity(project.id);
    } catch (taskError) {
      setError(getProjectErrorMessage(taskError, t("tasks.loadError")));
    } finally {
      setUpdatingTaskId(null);
    }
  }

  async function handleUpdateTask(task: ProjectTask, draft: TaskEditDraft) {
    if (!project) {
      return false;
    }

    const title = draft.title.trim();

    if (!title || !isValidTaskDueDateInputValue(draft.dueDate)) {
      return false;
    }

    if (task.status !== "NEW" && !draft.assigneeId) {
      return false;
    }

    setError("");
    setSavingTaskId(task.id);

    try {
      const updatedTask = await updateTask(task.id, {
        title,
        description: draft.description.trim() || null,
        priority: draft.priority,
        dueDate: draft.dueDate ? new Date(draft.dueDate).toISOString() : null,
        assigneeId: draft.assigneeId ? Number(draft.assigneeId) : null,
      });
      setProject(updateProjectTask(project, updatedTask));
      await refreshProjectActivity(project.id);
      return true;
    } catch (taskUpdateError) {
      setError(getProjectErrorMessage(taskUpdateError, t("tasks.loadError")));
      return false;
    } finally {
      setSavingTaskId(null);
    }
  }

  async function handleDeleteTask(task: ProjectTask) {
    if (!project) {
      return false;
    }

    setError("");
    setDeletingTaskId(task.id);

    try {
      await deleteTask(task.id);
      setProject({
        ...project,
        stages: project.stages.map((stage) =>
          stage.id === task.stageId
            ? { ...stage, tasks: stage.tasks.filter((stageTask) => stageTask.id !== task.id) }
            : stage,
        ),
      });
      await refreshProjectActivity(project.id);
      return true;
    } catch (taskDeleteError) {
      setError(getProjectErrorMessage(taskDeleteError, t("tasks.loadError")));
      return false;
    } finally {
      setDeletingTaskId(null);
    }
  }

  const handleUpdateProjectName: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();

    if (!project) {
      return;
    }

    const name = projectNameDraft.trim();

    if (!name || name === project.name) {
      setProjectNameDraft(project.name);
      setIsEditingProjectName(false);
      return;
    }

    setError("");
    setIsUpdatingProjectName(true);

    try {
      const updatedProject = await updateProject(project.id, { name });
      setProject(updatedProject);
      setProjectNameDraft(updatedProject.name);
      setIsEditingProjectName(false);
      await refreshProjectActivity(updatedProject.id);
    } catch (projectUpdateError) {
      setError(getProjectErrorMessage(projectUpdateError, t("projectDetails.unavailableMessage")));
    } finally {
      setIsUpdatingProjectName(false);
    }
  };

  const handleProjectNameEditKeyDown: ComponentProps<"form">["onKeyDown"] = (event) => {
    if (event.key !== "Escape" || !project) {
      return;
    }

    event.preventDefault();
    setProjectNameDraft(project.name);
    setIsEditingProjectName(false);
    setError("");
  };

  async function handleUpdateStageName(stageId: number, name: string) {
    if (!project) {
      return false;
    }

    setError("");
    setUpdatingStageId(stageId);

    try {
      const updatedStage = await updateStage(stageId, { name });
      setProject({
        ...project,
        stages: project.stages.map((stage) =>
          stage.id === updatedStage.id ? { ...stage, name: updatedStage.name } : stage,
        ),
      });
      await refreshProjectActivity(project.id);
      return true;
    } catch (stageUpdateError) {
      setError(getProjectErrorMessage(stageUpdateError, t("projectDetails.unavailableMessage")));
      return false;
    } finally {
      setUpdatingStageId(null);
    }
  }

  async function handleDeleteStage(stageId: number) {
    if (!project) {
      return false;
    }

    setError("");
    setDeletingStageId(stageId);

    try {
      await deleteStage(stageId);
      setProject({
        ...project,
        stages: project.stages.filter((stage) => stage.id !== stageId),
      });
      setTaskDrafts((currentDrafts) => {
        const nextDrafts = { ...currentDrafts };
        delete nextDrafts[stageId];
        return nextDrafts;
      });
      await refreshProjectActivity(project.id);
      return true;
    } catch (stageDeleteError) {
      setError(getProjectErrorMessage(stageDeleteError, t("projectDetails.unavailableMessage")));
      return false;
    } finally {
      setDeletingStageId(null);
    }
  }

  async function handleDeleteProject() {
    if (!project) {
      return;
    }

    setError("");
    setIsDeletingProject(true);

    try {
      await deleteProject(project.id);
      navigate("/projects", { replace: true });
    } catch (deleteError) {
      setError(getProjectErrorMessage(deleteError, t("projectDetails.unavailableMessage")));
      setIsDeletingProject(false);
    }
  }

  if (isLoading) {
    return (
      <main className="app-shell">
        <LoadingState message={t("projectDetails.loading")} />
      </main>
    );
  }

  if (!project) {
    return (
      <main className="app-shell">
        <Link className="text-link" to="/projects">
          {t("projectDetails.back")}
        </Link>
        <ErrorState
          message={projectLoadError || t("projectDetails.unavailableMessage")}
          title={t("projectDetails.unavailableTitle")}
        />
      </main>
    );
  }

  const tasks = project.stages.flatMap((stage) => stage.tasks);
  const visibleTasks = filterTasks(tasks, taskStatusFilter, taskPriorityFilter);
  const taskSummary = getTaskSummary(tasks);
  const isCurrentUserProjectMember = project.users.some((member) => member.userId === user?.id);
  const canManageCurrentProject =
    user?.role === "ADMIN" || (user?.role === "MANAGER" && isCurrentUserProjectMember);
  const canEditProject = canManageCurrentProject;
  const canCreateStage = canManageCurrentProject;
  const canManageStages = canManageCurrentProject;
  const canCreateTask = canManageCurrentProject;
  const canManageTasks = canManageCurrentProject;
  const canManageCurrentProjectMembers =
    canManageCurrentProject;
  const canCreateProjectUsers = canCreateUsers && canManageCurrentProjectMembers;
  const availableUsers = users.filter(
    (availableUser) =>
      !project.users.some((member) => member.userId === availableUser.id) &&
      (user?.role === "ADMIN" || availableUser.role === "WORKER"),
  );
  const isNewUserPhoneValid = isValidOptionalPhone(newUserDraft.phone);
  const shouldShowNewUserPhoneError = !isNewUserPhoneValid && isNewUserPhoneTouched;

  return (
    <main className="app-shell">
      <Link className="text-link" to="/projects">
        {t("projectDetails.back")}
      </Link>

      <header className="project-hero">
        <div>
          <p className="eyebrow">{t("projectDetails.projectEyebrow", { id: project.id })}</p>
          {isEditingProjectName ? (
            <form
              className="project-edit-form"
              onKeyDown={handleProjectNameEditKeyDown}
              onSubmit={handleUpdateProjectName}
            >
              <label>
                {t("projectDetails.projectName")}
                <input
                  aria-describedby={error ? "project-action-error" : undefined}
                  autoFocus
                  onChange={(event) => setProjectNameDraft(event.target.value)}
                  value={projectNameDraft}
                />
              </label>
              <div className="compact-actions">
                <button
                  className="secondary-button"
                  disabled={isUpdatingProjectName}
                  onClick={() => {
                    setProjectNameDraft(project.name);
                    setIsEditingProjectName(false);
                    setError("");
                  }}
                  type="button"
                >
                  {t("common.cancel")}
                </button>
                <button
                  disabled={isUpdatingProjectName || !projectNameDraft.trim()}
                  type="submit"
                >
                  {isUpdatingProjectName ? t("common.saving") : t("common.save")}
                </button>
              </div>
            </form>
          ) : (
            <div className="project-title-row">
              <h1>{project.name}</h1>
              {canEditProject ? (
                <button
                  aria-label={t("common.edit")}
                  className="icon-button project-edit-button"
                  onClick={() => {
                    setProjectNameDraft(project.name);
                    setIsEditingProjectName(true);
                    setError("");
                  }}
                  title={t("common.edit")}
                  type="button"
                >
                  <PencilIcon />
                </button>
              ) : null}
            </div>
          )}
          <p className="muted">
            {t("common.created")} {formatDate(project.createdAt, i18n.language)}
          </p>
        </div>

        <div className="project-hero-side">
          <dl className="summary-grid">
            <div>
              <dt>{t("projects.statsStages")}</dt>
              <dd>{project.stages.length}</dd>
            </div>
            <div>
              <dt>{t("projects.statsTasks")}</dt>
              <dd>{tasks.length}</dd>
            </div>
            <div>
              <dt>{t("projects.statsMembers")}</dt>
              <dd>{project.users.length}</dd>
            </div>
          </dl>

          {canDeleteProject ? (
            <button
              className="danger-button project-delete-button"
              disabled={isDeletingProject}
              onClick={() => setIsConfirmingDelete(true)}
              type="button"
            >
              {t("projectDetails.deleteProject")}
            </button>
          ) : null}
        </div>
      </header>

      <ConfirmDialog
        cancelLabel={t("common.cancel")}
        confirmLabel={t("projectDetails.deletePermanently")}
        confirmingLabel={t("common.deleting")}
        isConfirming={isDeletingProject}
        isOpen={isConfirmingDelete}
        message={t("projectDetails.deleteProjectMessage")}
        onCancel={() => setIsConfirmingDelete(false)}
        onConfirm={handleDeleteProject}
        title={t("projectDetails.deleteProjectTitle")}
      />

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>{t("projectDetails.taskOverview")}</h2>
            <p className="muted">{t("projectDetails.taskOverviewDescription")}</p>
          </div>
          <span className="counter-badge">{visibleTasks.length}</span>
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
            <dt>{t("tasks.done")}</dt>
            <dd>{taskSummary.DONE}</dd>
          </div>
          <div>
            <dt>{t("tasks.highPriority")}</dt>
            <dd>{taskSummary.HIGH}</dd>
          </div>
        </dl>

        <div className="filters-row">
          <label>
            {t("projectDetails.status")}
            <select
              onChange={(event) => setTaskStatusFilter(event.target.value as TaskStatus | "ALL")}
              value={taskStatusFilter}
            >
              <option value="ALL">{t("statuses.ALL")}</option>
              <option value="NEW">{t("statuses.NEW")}</option>
              <option value="IN_PROGRESS">{t("statuses.IN_PROGRESS")}</option>
              <option value="DONE">{t("statuses.DONE")}</option>
            </select>
          </label>

          <label>
            {t("projectDetails.priority")}
            <select
              onChange={(event) =>
                setTaskPriorityFilter(event.target.value as TaskPriority | "ALL")
              }
              value={taskPriorityFilter}
            >
              <option value="ALL">{t("priorities.ALL")}</option>
              <option value="LOW">{t("priorities.LOW")}</option>
              <option value="MEDIUM">{t("priorities.MEDIUM")}</option>
              <option value="HIGH">{t("priorities.HIGH")}</option>
            </select>
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>{t("projectDetails.activity")}</h2>
            <p className="muted">{t("projectDetails.activityDescription")}</p>
          </div>
          <span className="counter-badge">{activityLogs.length}</span>
        </div>

        {isLoadingActivity ? <LoadingState message={t("projectDetails.refreshingActivity")} /> : null}

        {!isLoadingActivity && activityLogs.length === 0 ? (
          <p className="muted">{t("projectDetails.noActivity")}</p>
        ) : null}

        {!isLoadingActivity && activityLogs.length > 0 ? (
          <div className="activity-list">
            {activityLogs.slice(0, 8).map((activity) => (
              <article className="activity-item" key={activity.id}>
                <div>
                  <strong>
                    {activity.user ? getUserDisplayName(activity.user) : t("common.system")}
                  </strong>
                  <p>{activity.message}</p>
                </div>
                <time dateTime={activity.createdAt}>
                  {formatDateTime(activity.createdAt, i18n.language)}
                </time>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>{t("projectDetails.team")}</h2>
            <p className="muted">{t("projectDetails.teamDescription")}</p>
          </div>
        </div>

        {project.users.length > 0 ? (
          <div className="members-list">
            {project.users.map((member) => (
              <div className="member-row" key={member.userId}>
                <div>
                  <details className="contact-details">
                    <summary>{getUserDisplayName(member.user)}</summary>
                    <div className="contact-details-body">
                      <a href={`mailto:${member.user.email}`}>{member.user.email}</a>
                      {member.user.phone ? (
                        <a href={`tel:${member.user.phone}`}>{member.user.phone}</a>
                      ) : (
                        <span>{t("common.noPhone")}</span>
                      )}
                    </div>
                  </details>
                  <strong>{t(`roles.${member.user.role}`)}</strong>
                </div>
                {canManageCurrentProjectMembers &&
                (user?.role === "ADMIN" || member.user.role === "WORKER") ? (
                  <button
                    className="danger-button"
                    disabled={removingMemberId === member.userId}
                    onClick={() => setMemberToRemove(member)}
                    type="button"
                  >
                    {removingMemberId === member.userId ? t("common.removing") : t("common.remove")}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">{t("projectDetails.noMembers")}</p>
        )}

        {canCreateProjectUsers ? (
          <div className="team-management">
            <form className="member-form" onSubmit={handleAddMember}>
              <label>
                {t("projectDetails.addExistingUser")}
                <select
                  disabled={isLoadingUsers || availableUsers.length === 0}
                  onChange={(event) => setSelectedMemberId(event.target.value)}
                  value={selectedMemberId}
                >
                  <option value="">
                    {availableUsers.length > 0
                      ? t("projectDetails.selectUser")
                      : t("projectDetails.noAvailableUsers")}
                  </option>
                  {availableUsers.map((availableUser) => (
                    <option key={availableUser.id} value={availableUser.id}>
                      {getUserDisplayName(availableUser)} ({t(`roles.${availableUser.role}`)})
                    </option>
                  ))}
                </select>
              </label>
              <button disabled={isAddingMember || !selectedMemberId} type="submit">
                {isAddingMember ? t("common.adding") : t("projectDetails.addMember")}
              </button>
            </form>

            <div className="form-section-heading">
              <h3>
                {canSelectNewUserRole
                  ? t("projectDetails.createUserTitle")
                  : t("projectDetails.createWorkerTitle")}
              </h3>
              <p className="muted">
                {canSelectNewUserRole
                  ? t("projectDetails.createUserDescription")
                  : t("projectDetails.createWorkerDescription")}
              </p>
            </div>

            <form className="member-form member-form-wide" onSubmit={handleCreateUser}>
              <label>
                {t("projectDetails.firstName")}
                <input
                  autoComplete="given-name"
                  onChange={(event) =>
                    setNewUserDraft((currentDraft) => ({
                      ...currentDraft,
                      firstName: event.target.value,
                    }))
                  }
                  placeholder={t("projectDetails.firstNamePlaceholder")}
                  value={newUserDraft.firstName}
                />
              </label>

              <label>
                {t("projectDetails.lastName")}
                <input
                  autoComplete="family-name"
                  onChange={(event) =>
                    setNewUserDraft((currentDraft) => ({
                      ...currentDraft,
                      lastName: event.target.value,
                    }))
                  }
                  placeholder={t("projectDetails.lastNamePlaceholder")}
                  value={newUserDraft.lastName}
                />
              </label>

              <label>
                {t("projectDetails.phone")}
                <input
                  aria-invalid={shouldShowNewUserPhoneError}
                  autoComplete="tel"
                  onBlur={() => setIsNewUserPhoneTouched(true)}
                  onChange={(event) =>
                    setNewUserDraft((currentDraft) => ({
                      ...currentDraft,
                      phone: event.target.value,
                    }))
                  }
                  placeholder={t("projectDetails.phonePlaceholder")}
                  type="tel"
                  value={newUserDraft.phone}
                />
                {shouldShowNewUserPhoneError ? (
                  <span className="field-error">{t("projectDetails.phoneValidation")}</span>
                ) : null}
              </label>

              <label>
                {t("projectDetails.email")}
                <input
                  onChange={(event) =>
                    setNewUserDraft((currentDraft) => ({
                      ...currentDraft,
                      email: event.target.value,
                    }))
                  }
                  placeholder={t("projectDetails.emailPlaceholder")}
                  type="email"
                  value={newUserDraft.email}
                />
              </label>

              <label>
                {t("projectDetails.password")}
                <PasswordInput
                  autoComplete="new-password"
                  onChange={(event) =>
                    setNewUserDraft((currentDraft) => ({
                      ...currentDraft,
                      password: event.target.value,
                    }))
                  }
                  placeholder={t("projectDetails.passwordPlaceholder")}
                  value={newUserDraft.password}
                />
              </label>

              {canSelectNewUserRole ? (
                <label>
                  {t("projectDetails.role")}
                  <select
                    onChange={(event) =>
                      setNewUserDraft((currentDraft) => ({
                        ...currentDraft,
                        role: event.target.value as UserRole,
                      }))
                    }
                    value={newUserDraft.role}
                  >
                    <option value="WORKER">{t("roles.WORKER")}</option>
                    <option value="MANAGER">{t("roles.MANAGER")}</option>
                    <option value="ADMIN">{t("roles.ADMIN")}</option>
                  </select>
                </label>
              ) : null}

              <button
                disabled={
                  isCreatingUser ||
                  !newUserDraft.firstName.trim() ||
                  !newUserDraft.lastName.trim() ||
                  !newUserDraft.email.trim() ||
                  !isNewUserPhoneValid ||
                  newUserDraft.password.trim().length < 6
                }
                type="submit"
              >
                {isCreatingUser ? t("common.creating") : t("projectDetails.createUser")}
              </button>
            </form>
          </div>
        ) : canManageCurrentProjectMembers ? (
          <p className="muted team-note">
            {t("projectDetails.userCreationNote")}
          </p>
        ) : null}
      </section>

      <ConfirmDialog
        cancelLabel={t("common.cancel")}
        confirmLabel={t("projectDetails.removeMember")}
        confirmingLabel={t("common.removing")}
        isConfirming={Boolean(removingMemberId)}
        isOpen={Boolean(memberToRemove)}
        message={
          memberToRemove
            ? t("projectDetails.removeMemberMessage", {
                name: getUserDisplayName(memberToRemove.user),
              })
            : ""
        }
        onCancel={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
        title={t("projectDetails.removeMemberTitle")}
      />

      {canCreateStage ? (
        <section className="panel">
          <div>
            <h2>{t("projectDetails.createStage")}</h2>
            <p className="muted">{t("projectDetails.createStageDescription")}</p>
          </div>

          <form className="inline-form" onSubmit={handleCreateStage}>
            <label>
              {t("projectDetails.stageName")}
              <input
                onChange={(event) => setStageName(event.target.value)}
                placeholder={t("projectDetails.stageNamePlaceholder")}
                value={stageName}
              />
            </label>
            <button disabled={isCreatingStage || !stageName.trim()} type="submit">
              {isCreatingStage ? t("common.creating") : t("common.create")}
            </button>
          </form>
        </section>
      ) : null}

      {error ? (
        <p className="form-error" id="project-action-error">
          {error}
        </p>
      ) : null}

      <section className="stages-layout">
        {project.stages.length > 0 ? (
          project.stages.map((stage) => (
            <StageColumn
              canCreateTask={canCreateTask}
              canManageTask={canManageTasks}
              canManageStage={canManageStages}
              canUpdateTaskStatusInProject={canManageCurrentProject || user?.role === "WORKER"}
              deletingTaskId={deletingTaskId}
              deletingStageId={deletingStageId}
              key={stage.id}
              members={project.users}
              onCreateTask={() => handleCreateTask(stage.id)}
              onDeleteTask={handleDeleteTask}
              onDeleteStage={handleDeleteStage}
              onTaskDraftChange={(draft) => updateTaskDraft(stage.id, draft)}
              onUpdateTask={handleUpdateTask}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onUpdateStageName={handleUpdateStageName}
              priorityFilter={taskPriorityFilter}
              stage={stage}
              statusFilter={taskStatusFilter}
              taskDraft={getTaskDraft(taskDrafts, stage.id)}
              savingTaskId={savingTaskId}
              updatingStageId={updatingStageId}
              updatingTaskId={updatingTaskId}
              user={user}
              isCreatingTask={creatingTaskStageId === stage.id}
            />
          ))
        ) : (
          <EmptyState
            message={t("projectDetails.noStagesMessage")}
            title={t("projectDetails.noStagesTitle")}
          />
        )}
      </section>
    </main>
  );
}

type UserDraft = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
};

function getProjectErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function formatDateTime(date: string, language: string) {
  return new Intl.DateTimeFormat(language, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function updateProjectTask(project: Project, updatedTask: ProjectTask) {
  return {
    ...project,
    stages: project.stages.map((stage) => ({
      ...stage,
      tasks: stage.tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    })),
  };
}

function createEmptyUserDraft(): UserDraft {
  return {
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "WORKER",
  };
}
