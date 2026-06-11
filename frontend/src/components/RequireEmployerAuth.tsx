import { useEffect } from "react";
import {
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { clearEmployerToken, getEmployerToken } from "../api";

const unauthorizedEventName = "job-board:employer-unauthorized";

export default function RequireEmployerAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = getEmployerToken();

  useEffect(() => {
    const handler = () => {
      clearEmployerToken();
      navigate("/employers/login", { replace: true });
    };
    window.addEventListener(unauthorizedEventName, handler);
    return () => window.removeEventListener(unauthorizedEventName, handler);
  }, [navigate]);

  if (!token) {
    return (
      <Navigate
        to="/employers/signup"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return (
    <div className="app">
      <header className="employer-shell-header">
        <nav className="employer-nav">
          <NavLink
            to="/employers/jobs"
            className={({ isActive }) =>
              `employer-nav-link${isActive ? " is-active" : ""}`
            }
          >
            Jobs
          </NavLink>
        </nav>
        <nav className="employer-nav">
          <NavLink
            to="/employers/stocks"
            className={({ isActive }) =>
              `employer-nav-link${isActive ? " is-active" : ""}`
            }
          >
            Stocks
          </NavLink>
        </nav>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            clearEmployerToken();
            navigate("/employers/login", { replace: true });
          }}
        >
          Sign out
        </button>
      </header>
      <Outlet />
    </div>
  );
}

