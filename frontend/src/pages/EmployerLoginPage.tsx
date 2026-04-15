import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { postJson, setEmployerToken } from "../api";
import type { EmployerAuthResponse } from "../types/employerAuth";

export default function EmployerLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const data = await postJson<
        EmployerAuthResponse,
        { email: string; password: string }
      >("/auth/employers/login", { email, password });
      setEmployerToken(data.token);
      navigate("/employers/jobs", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Log in failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app">
      <h1>Employer log in</h1>
      {error ? <p className="error">{error}</p> : null}
      <form className="form-grid auth-form" onSubmit={(e) => void handleSubmit(e)}>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={320}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="auth-footer">
        Need an account? <Link to="/employers/signup">Sign up</Link>
      </p>
    </div>
  );
}
