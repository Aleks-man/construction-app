import { useState, type ComponentProps } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/auth-context";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/projects" replace />;
  }

  const handleSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ email, password });

      const state = location.state as LocationState | null;
      navigate(state?.from?.pathname || "/projects", { replace: true });
    } catch (loginError) {
      setError(
        loginError instanceof ApiError
          ? loginError.message
          : t("auth.error"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="login-title">
        <div className="auth-panel-header">
          <div>
            <p className="eyebrow">{t("auth.eyebrow")}</p>
            <h1 id="login-title">{t("auth.title")}</h1>
            <p className="muted">{t("auth.description")}</p>
          </div>
          <LanguageSwitcher />
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            {t("auth.email")}
            <input
              autoComplete="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              required
              type="email"
              value={email}
            />
          </label>

          <label>
            {t("auth.password")}
            <input
              autoComplete="current-password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("auth.passwordPlaceholder")}
              required
              type="password"
              value={password}
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button disabled={isSubmitting} type="submit">
            {isSubmitting ? t("auth.submitting") : t("auth.submit")}
          </button>
        </form>
      </section>
    </main>
  );
}
