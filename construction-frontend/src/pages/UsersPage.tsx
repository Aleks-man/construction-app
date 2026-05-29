import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "../api/client";
import { createUser, deleteUser, getUsers, type AppUser, type UserRole } from "../api/users";
import { useAuth } from "../auth/auth-context";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PasswordInput } from "../components/PasswordInput";
import { EmptyState, ErrorState, LoadingState } from "../components/StateView";

const roles: UserRole[] = ["ADMIN", "MANAGER", "WORKER"];

export function UsersPage() {
  const { user } = useAuth();
  const { i18n, t } = useTranslation();
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
          setError(getUserErrorMessage(usersError, t("users.loadError")));
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
  }, [t]);

  if (user?.role !== "ADMIN") {
    return (
      <main className="app-shell">
        <ErrorState message={t("users.unavailableMessage")} title={t("users.unavailableTitle")} />
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
      setSuccessMessage(t("users.createdMessage", { email: createdUser.email }));
    } catch (createError) {
      setError(getUserErrorMessage(createError, t("users.loadError")));
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
      setSuccessMessage(t("users.deletedMessage", { email: deletedUser.email }));
    } catch (deleteError) {
      setError(getUserErrorMessage(deleteError, t("users.loadError")));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="app-shell">
      <header className="page-heading">
        <p className="eyebrow">{t("users.eyebrow")}</p>
        <h1>{t("users.title")}</h1>
        <p className="muted">{t("users.description")}</p>
      </header>

      <section className="panel">
        <div>
          <h2>{t("users.createTitle")}</h2>
          <p className="muted">{t("users.createDescription")}</p>
        </div>

        <form className="member-form member-form-wide users-create-form" onSubmit={handleCreateUser}>
          <label>
            {t("users.email")}
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("users.emailPlaceholder")}
              required
              type="email"
              value={email}
            />
          </label>

          <label>
            {t("users.password")}
            <PasswordInput
              autoComplete="new-password"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("users.passwordPlaceholder")}
              required
              value={password}
            />
          </label>

          <label>
            {t("users.role")}
            <select onChange={(event) => setRole(event.target.value as UserRole)} value={role}>
              {roles.map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {t(`roles.${roleOption}`)}
                </option>
              ))}
            </select>
          </label>

          <button disabled={isCreating || !email.trim() || password.length < 6} type="submit">
            {isCreating ? t("users.creating") : t("users.createUser")}
          </button>
        </form>
      </section>

      {error ? <p className="form-error">{error}</p> : null}
      {successMessage ? <p className="form-success">{successMessage}</p> : null}

      <section className="projects-section">
        <div className="section-heading">
          <div>
            <h2>{t("users.listTitle")}</h2>
            <p className="muted">{t("users.listDescription")}</p>
          </div>
          <span className="counter-badge">{users.length}</span>
        </div>

        <div className="role-tabs" role="tablist" aria-label={t("users.roleFilter")}>
          {roles.map((roleOption) => (
            <button
              aria-selected={activeRole === roleOption}
              className={activeRole === roleOption ? "active" : ""}
              key={roleOption}
              onClick={() => setActiveRole(roleOption)}
              role="tab"
              type="button"
            >
              {t(`roles.${roleOption}`)}
              <span>{roleCounts[roleOption]}</span>
            </button>
          ))}
        </div>

        {isLoading ? <LoadingState message={t("users.loading")} /> : null}

        {!isLoading && error && users.length === 0 ? (
          <ErrorState message={error} title={t("users.unavailableTitle")} />
        ) : null}

        {!isLoading && !error && visibleUsers.length === 0 ? (
          <EmptyState
            message={t("users.emptyMessage", {
              role: t(`roles.${activeRole}`).toLowerCase(),
            })}
            title={t("users.emptyTitle")}
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
                      {t(`roles.${appUser.role}`)} - {t("common.created")}{" "}
                      {formatDate(appUser.createdAt, i18n.language)}
                    </p>
                  </div>

                  {isCurrentUser ? (
                    <span className="current-user-badge">{t("common.currentUser")}</span>
                  ) : (
                    <button
                      className="danger-button"
                      onClick={() => setUserToDelete(appUser)}
                      type="button"
                    >
                      {t("common.delete")}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        ) : null}
      </section>

      <ConfirmDialog
        cancelLabel={t("common.cancel")}
        confirmLabel={t("users.deleteUser")}
        confirmingLabel={t("common.deleting")}
        isConfirming={isDeleting}
        isOpen={Boolean(userToDelete)}
        message={userToDelete ? t("users.deleteMessage", { email: userToDelete.email }) : ""}
        onCancel={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title={t("users.deleteTitle")}
      />
    </main>
  );
}

function formatDate(date: string, language: string) {
  return new Intl.DateTimeFormat(language, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getUserErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}
