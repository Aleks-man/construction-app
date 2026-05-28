import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { ApiError } from "../api/client";
import { createUser, deleteUser, getUsers, type AppUser, type UserRole } from "../api/users";
import { useAuth } from "../auth/auth-context";
import { EmptyState, ErrorState, LoadingState } from "../components/StateView";

const roles: UserRole[] = ["ADMIN", "MANAGER", "WORKER"];

export function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [activeRole, setActiveRole] = useState<UserRole>("WORKER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("WORKER");
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const visibleUsers = useMemo(
    () => users.filter((appUser) => appUser.role === activeRole),
    [activeRole, users],
  );

  const roleCounts = useMemo(
    () =>
      roles.reduce<Record<UserRole, number>>(
        (counts, currentRole) => ({
          ...counts,
          [currentRole]: users.filter((appUser) => appUser.role === currentRole).length,
        }),
        {
          ADMIN: 0,
          MANAGER: 0,
          WORKER: 0,
        },
      ),
    [users],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      try {
        const usersResponse = await getUsers();

        if (isMounted) {
          setUsers(usersResponse);
        }
      } catch (usersError) {
        if (isMounted) {
          setError(getUserErrorMessage(usersError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  if (user?.role !== "ADMIN") {
    return (
      <main className="app-shell">
        <ErrorState
          message="Only admins can manage application users."
          title="Users unavailable"
        />
      </main>
    );
  }

  const handleCreateUser: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsCreating(true);

    try {
      const createdUser = await createUser({
        email: email.trim(),
        password,
        role,
      });

      setUsers((currentUsers) => [createdUser, ...currentUsers]);
      setEmail("");
      setPassword("");
      setRole("WORKER");
      setActiveRole(createdUser.role);
      setSuccessMessage(`User ${createdUser.email} was created.`);
    } catch (createError) {
      setError(getUserErrorMessage(createError));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) {
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsDeleting(true);

    try {
      const deletedUser = await deleteUser(userToDelete.id);

      setUsers((currentUsers) =>
        currentUsers.filter((appUser) => appUser.id !== deletedUser.id),
      );
      setUserToDelete(null);
      setSuccessMessage(`User ${deletedUser.email} was deleted.`);
    } catch (deleteError) {
      setError(getUserErrorMessage(deleteError));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="app-shell">
      <header className="page-heading">
        <p className="eyebrow">Users</p>
        <h1>Team administration</h1>
        <p className="muted">
          Create admins, managers and workers, and remove accounts that are no longer needed.
        </p>
      </header>

      <section className="panel">
        <div>
          <h2>Create user</h2>
          <p className="muted">New users can sign in immediately with the password you set.</p>
        </div>

        <form className="member-form member-form-wide users-create-form" onSubmit={handleCreateUser}>
          <label>
            Email
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="worker@example.com"
              required
              type="email"
              value={email}
            />
          </label>

          <label>
            Password
            <input
              autoComplete="new-password"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              required
              type="password"
              value={password}
            />
          </label>

          <label>
            Role
            <select onChange={(event) => setRole(event.target.value as UserRole)} value={role}>
              {roles.map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {formatRole(roleOption)}
                </option>
              ))}
            </select>
          </label>

          <button disabled={isCreating || !email.trim() || password.length < 6} type="submit">
            {isCreating ? "Creating..." : "Create user"}
          </button>
        </form>
      </section>

      {error ? <p className="form-error">{error}</p> : null}
      {successMessage ? <p className="form-success">{successMessage}</p> : null}

      <section className="projects-section">
        <div className="section-heading">
          <div>
            <h2>Users</h2>
            <p className="muted">Review user roles and remove inactive accounts.</p>
          </div>
          <span className="counter-badge">{users.length}</span>
        </div>

        <div className="role-tabs" role="tablist" aria-label="User role filter">
          {roles.map((roleOption) => (
            <button
              aria-selected={activeRole === roleOption}
              className={activeRole === roleOption ? "active" : ""}
              key={roleOption}
              onClick={() => setActiveRole(roleOption)}
              role="tab"
              type="button"
            >
              {formatRole(roleOption)}
              <span>{roleCounts[roleOption]}</span>
            </button>
          ))}
        </div>

        {isLoading ? <LoadingState message="Loading users..." /> : null}

        {!isLoading && error && users.length === 0 ? (
          <ErrorState message={error} title="Users unavailable" />
        ) : null}

        {!isLoading && !error && visibleUsers.length === 0 ? (
          <EmptyState
            message={`No ${formatRole(activeRole).toLowerCase()} users yet.`}
            title="No users found"
          />
        ) : null}

        {!isLoading && visibleUsers.length > 0 ? (
          <div className="users-list">
            {visibleUsers.map((appUser) => {
              const isCurrentUser = appUser.id === user.id;

              return (
                <article className="user-card" key={appUser.id}>
                  <div>
                    <strong>{appUser.email}</strong>
                    <p className="muted">
                      {formatRole(appUser.role)} · Created {formatDate(appUser.createdAt)}
                    </p>
                  </div>

                  {isCurrentUser ? (
                    <span className="current-user-badge">Current user</span>
                  ) : (
                    <button
                      className="danger-button"
                      onClick={() => setUserToDelete(appUser)}
                      type="button"
                    >
                      Delete
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        ) : null}
      </section>

      {userToDelete ? (
        <section className="danger-panel" aria-live="polite">
          <div>
            <h2>Delete user?</h2>
            <p className="muted">
              {userToDelete.email} will be removed from projects and unassigned from tasks.
            </p>
          </div>

          <div className="danger-actions">
            <button
              className="secondary-button"
              disabled={isDeleting}
              onClick={() => setUserToDelete(null)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="danger-button"
              disabled={isDeleting}
              onClick={handleDeleteUser}
              type="button"
            >
              {isDeleting ? "Deleting..." : "Delete user"}
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function formatRole(role: UserRole) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getUserErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Unable to manage users";
}
