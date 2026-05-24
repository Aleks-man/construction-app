import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { addProjectUser, removeProjectUser } from "../api/project-users";
import {
  deleteProject,
  getProjectById,
  updateProject,
  type Project,
  type ProjectTask,
  type TaskPriority,
  type TaskStatus,
} from "../api/projects";
import { createStage, deleteStage, updateStage } from "../api/stages";
import { createTask, deleteTask, updateTask, updateTaskStatus } from "../api/tasks";
import { createUser, getUsers, type AppUser, type UserRole } from "../api/users";
import { useAuth } from "../auth/auth-context";
import { EmptyState, ErrorState, LoadingState } from "../components/StateView";
import { StageColumn } from "./StageColumn";
import type { TaskEditDraft } from "./TaskCard";
import {
  createEmptyTaskDraft,
  filterTasks,
  formatDate,
  getTaskDraft,
  getTaskSummary,
  type TaskDraft,
} from "./project-details-utils";

export function ProjectDetailsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [stageName, setStageName] = useState("");
  const [projectNameDraft, setProjectNameDraft] = useState("");
  const [taskDrafts, setTaskDrafts] = useState<Record<number, TaskDraft>>({});
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [newUserDraft, setNewUserDraft] = useState<UserDraft>(createEmptyUserDraft());
  const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<TaskPriority | "ALL">("ALL");
  const [error, setError] = useState("");
  const [projectLoadError, setProjectLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
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
  const canEditProject = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canDeleteProject = user?.role === "ADMIN";
  const canCreateStage = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canManageStages = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canCreateTask = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canManageTasks = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canManageMembers = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canCreateUsers = user?.role === "ADMIN";
  const parsedProjectId = useMemo(() => Number(projectId), [projectId]);

  useEffect(() => {
    let isMounted = true;

    async function loadProject() {
      if (!Number.isInteger(parsedProjectId) || parsedProjectId <= 0) {
        setProjectLoadError("Project id is invalid");
        setIsLoading(false);
        return;
      }

      try {
        const projectResponse = await getProjectById(parsedProjectId);

        if (isMounted) {
          setProject(projectResponse);
        }
      } catch (projectError) {
        if (isMounted) {
          setProjectLoadError(getProjectErrorMessage(projectError));
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
  }, [parsedProjectId]);

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
          setError(getProjectErrorMessage(usersError));
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
  }, [canCreateUsers]);

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
    } catch (stageError) {
      setError(getProjectErrorMessage(stageError));
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

    if (!title) {
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
    } catch (taskError) {
      setError(getProjectErrorMessage(taskError));
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

    if (!email || !password) {
      return;
    }

    setError("");
    setIsCreatingUser(true);

    try {
      const createdUser = await createUser({
        email,
        password,
        role: newUserDraft.role,
      });
      setUsers((currentUsers) => [createdUser, ...currentUsers]);
      setSelectedMemberId(String(createdUser.id));
      setNewUserDraft(createEmptyUserDraft());
    } catch (userError) {
      setError(getProjectErrorMessage(userError));
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
    } catch (memberError) {
      setError(getProjectErrorMessage(memberError));
    } finally {
      setIsAddingMember(false);
    }
  };

  async function handleRemoveMember(userId: number) {
    if (!project) {
      return;
    }

    setError("");
    setRemovingMemberId(userId);

    try {
      await removeProjectUser(project.id, userId);
      setProject({
        ...project,
        users: project.users.filter((member) => member.userId !== userId),
      });
    } catch (memberError) {
      setError(getProjectErrorMessage(memberError));
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
    } catch (taskError) {
      setError(getProjectErrorMessage(taskError));
    } finally {
      setUpdatingTaskId(null);
    }
  }

  async function handleUpdateTask(task: ProjectTask, draft: TaskEditDraft) {
    if (!project) {
      return false;
    }

    const title = draft.title.trim();

    if (!title) {
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
      return true;
    } catch (taskUpdateError) {
      setError(getProjectErrorMessage(taskUpdateError));
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
      return true;
    } catch (taskDeleteError) {
      setError(getProjectErrorMessage(taskDeleteError));
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
    } catch (projectUpdateError) {
      setError(getProjectErrorMessage(projectUpdateError));
    } finally {
      setIsUpdatingProjectName(false);
    }
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
      return true;
    } catch (stageUpdateError) {
      setError(getProjectErrorMessage(stageUpdateError));
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
      return true;
    } catch (stageDeleteError) {
      setError(getProjectErrorMessage(stageDeleteError));
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
      setError(getProjectErrorMessage(deleteError));
      setIsDeletingProject(false);
    }
  }

  if (isLoading) {
    return (
      <main className="app-shell">
        <LoadingState message="Loading project..." />
      </main>
    );
  }

  if (!project) {
    return (
      <main className="app-shell">
        <Link className="text-link" to="/projects">
          Back to projects
        </Link>
        <ErrorState
          message={projectLoadError || "Unable to load project"}
          title="Project unavailable"
        />
      </main>
    );
  }

  const tasks = project.stages.flatMap((stage) => stage.tasks);
  const visibleTasks = filterTasks(tasks, taskStatusFilter, taskPriorityFilter);
  const taskSummary = getTaskSummary(tasks);
  const availableUsers = users.filter(
    (availableUser) => !project.users.some((member) => member.userId === availableUser.id),
  );

  return (
    <main className="app-shell">
      <Link className="text-link" to="/projects">
        Back to projects
      </Link>

      <header className="project-hero">
        <div>
          <p className="eyebrow">Project #{project.id}</p>
          {isEditingProjectName ? (
            <form className="project-edit-form" onSubmit={handleUpdateProjectName}>
              <label>
                Project name
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
                  Cancel
                </button>
                <button
                  disabled={isUpdatingProjectName || !projectNameDraft.trim()}
                  type="submit"
                >
                  {isUpdatingProjectName ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          ) : (
            <div className="project-title-row">
              <h1>{project.name}</h1>
              {canEditProject ? (
                <button
                  className="secondary-button project-edit-button"
                  onClick={() => {
                    setProjectNameDraft(project.name);
                    setIsEditingProjectName(true);
                    setError("");
                  }}
                  type="button"
                >
                  Edit
                </button>
              ) : null}
            </div>
          )}
          <p className="muted">Created {formatDate(project.createdAt)}</p>
        </div>

        <div className="project-hero-side">
          <dl className="summary-grid">
            <div>
              <dt>Stages</dt>
              <dd>{project.stages.length}</dd>
            </div>
            <div>
              <dt>Tasks</dt>
              <dd>{tasks.length}</dd>
            </div>
            <div>
              <dt>Members</dt>
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
              Delete project
            </button>
          ) : null}
        </div>
      </header>

      {isConfirmingDelete ? (
        <section className="danger-panel">
          <div>
            <h2>Delete project?</h2>
            <p className="muted">
              This will permanently remove the project, its stages, tasks and team assignments.
            </p>
          </div>

          <div className="danger-actions">
            <button
              className="secondary-button"
              disabled={isDeletingProject}
              onClick={() => setIsConfirmingDelete(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="danger-button"
              disabled={isDeletingProject}
              onClick={handleDeleteProject}
              type="button"
            >
              {isDeletingProject ? "Deleting..." : "Delete permanently"}
            </button>
          </div>
        </section>
      ) : null}

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Task overview</h2>
            <p className="muted">Filter work by current status and priority.</p>
          </div>
          <span className="counter-badge">{visibleTasks.length}</span>
        </div>

        <dl className="task-summary-grid">
          <div>
            <dt>New</dt>
            <dd>{taskSummary.NEW}</dd>
          </div>
          <div>
            <dt>In progress</dt>
            <dd>{taskSummary.IN_PROGRESS}</dd>
          </div>
          <div>
            <dt>Done</dt>
            <dd>{taskSummary.DONE}</dd>
          </div>
          <div>
            <dt>High priority</dt>
            <dd>{taskSummary.HIGH}</dd>
          </div>
        </dl>

        <div className="filters-row">
          <label>
            Status
            <select
              onChange={(event) => setTaskStatusFilter(event.target.value as TaskStatus | "ALL")}
              value={taskStatusFilter}
            >
              <option value="ALL">All statuses</option>
              <option value="NEW">New</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="DONE">Done</option>
            </select>
          </label>

          <label>
            Priority
            <select
              onChange={(event) =>
                setTaskPriorityFilter(event.target.value as TaskPriority | "ALL")
              }
              value={taskPriorityFilter}
            >
              <option value="ALL">All priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Team</h2>
            <p className="muted">People assigned to this construction project.</p>
          </div>
        </div>

        {project.users.length > 0 ? (
          <div className="members-list">
            {project.users.map((member) => (
              <div className="member-row" key={member.userId}>
                <div>
                  <span>{member.user.email}</span>
                  <strong>{member.user.role}</strong>
                </div>
                {canManageMembers ? (
                  <button
                    className="danger-button"
                    disabled={removingMemberId === member.userId}
                    onClick={() => handleRemoveMember(member.userId)}
                    type="button"
                  >
                    {removingMemberId === member.userId ? "Removing..." : "Remove"}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No members assigned yet.</p>
        )}

        {canCreateUsers ? (
          <div className="team-management">
            <form className="member-form" onSubmit={handleAddMember}>
              <label>
                Add existing user
                <select
                  disabled={isLoadingUsers || availableUsers.length === 0}
                  onChange={(event) => setSelectedMemberId(event.target.value)}
                  value={selectedMemberId}
                >
                  <option value="">
                    {availableUsers.length > 0 ? "Select user" : "No available users"}
                  </option>
                  {availableUsers.map((availableUser) => (
                    <option key={availableUser.id} value={availableUser.id}>
                      {availableUser.email} ({availableUser.role})
                    </option>
                  ))}
                </select>
              </label>
              <button disabled={isAddingMember || !selectedMemberId} type="submit">
                {isAddingMember ? "Adding..." : "Add member"}
              </button>
            </form>

            <form className="member-form member-form-wide" onSubmit={handleCreateUser}>
              <label>
                New user email
                <input
                  onChange={(event) =>
                    setNewUserDraft((currentDraft) => ({
                      ...currentDraft,
                      email: event.target.value,
                    }))
                  }
                  placeholder="worker@test.com"
                  type="email"
                  value={newUserDraft.email}
                />
              </label>

              <label>
                Password
                <input
                  onChange={(event) =>
                    setNewUserDraft((currentDraft) => ({
                      ...currentDraft,
                      password: event.target.value,
                    }))
                  }
                  placeholder="At least 6 characters"
                  type="password"
                  value={newUserDraft.password}
                />
              </label>

              <label>
                Role
                <select
                  onChange={(event) =>
                    setNewUserDraft((currentDraft) => ({
                      ...currentDraft,
                      role: event.target.value as UserRole,
                    }))
                  }
                  value={newUserDraft.role}
                >
                  <option value="WORKER">Worker</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>

              <button
                disabled={
                  isCreatingUser ||
                  !newUserDraft.email.trim() ||
                  newUserDraft.password.trim().length < 6
                }
                type="submit"
              >
                {isCreatingUser ? "Creating..." : "Create user"}
              </button>
            </form>
          </div>
        ) : canManageMembers ? (
          <p className="muted team-note">
            User creation and member selection are available to admins. Managers can remove current
            project members.
          </p>
        ) : null}
      </section>

      {canCreateStage ? (
        <section className="panel">
          <div>
            <h2>Create stage</h2>
            <p className="muted">Add a project stage to organize construction work.</p>
          </div>

          <form className="inline-form" onSubmit={handleCreateStage}>
            <label>
              Stage name
              <input
                onChange={(event) => setStageName(event.target.value)}
                placeholder="Foundation"
                value={stageName}
              />
            </label>
            <button disabled={isCreatingStage || !stageName.trim()} type="submit">
              {isCreatingStage ? "Creating..." : "Create"}
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
            message="Create project stages to start organizing work."
            title="No stages yet"
          />
        )}
      </section>
    </main>
  );
}

type UserDraft = {
  email: string;
  password: string;
  role: UserRole;
};

function getProjectErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Unable to load project";
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
    role: "WORKER",
  };
}
