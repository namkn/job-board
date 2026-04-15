import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { postJson, setEmployerToken } from "../api";
import type { EmployerAuthResponse } from "../types/employerAuth";

function normalizeOrgSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function EmployerSignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationSlug, setOrganizationSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const data = await postJson<
        EmployerAuthResponse,
        {
          email: string;
          password: string;
          name: string;
          organizationName: string;
          organizationSlug: string;
        }
      >("/auth/employers/signup", {
        email,
        password,
        name,
        organizationName,
        organizationSlug: normalizeOrgSlug(organizationSlug),
      });
      setEmployerToken(data.token);
      navigate("/employers/jobs", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app">
      <h1>Create employer account</h1>
      <p className="auth-lead">
        You will be the <strong>owner</strong> of the organization you create.
      </p>
      {error ? <p className="error">{error}</p> : null}
      <form className="form-grid auth-form" onSubmit={(e) => void handleSubmit(e)}>
        <section className="auth-section">
          <h2>Your account</h2>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={200}
            />
          </label>
          <p className="field-hint">At least 8 characters.</p>
          <label>
            Your name <span className="optional">(optional)</span>
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
            />
          </label>
        </section>

        <section className="auth-section">
          <h2>Organization</h2>
          <label>
            Company / organization name
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              required
              maxLength={200}
            />
          </label>
          <label>
            URL slug
            <input
              type="text"
              value={organizationSlug}
              onChange={(e) => setOrganizationSlug(e.target.value)}
              required
              maxLength={60}
            />
          </label>
          <p className="field-hint">
            Used in URLs and must be unique (e.g. <code>acme-corp</code>).
          </p>
        </section>

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p className="auth-footer">
        Already have an account? <Link to="/employers/login">Log in</Link>
      </p>
    </div>
  );
}
