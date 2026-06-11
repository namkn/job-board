import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import "./App.css";
import RequireEmployerAuth from "./components/RequireEmployerAuth";
import EmployerLoginPage from "./pages/EmployerLoginPage";
import EmployerSignupPage from "./pages/EmployerSignupPage";
import JobDetailPage from "./pages/JobDetailPage";
import JobListPage from "./pages/JobListPage";
import StocksPage from "./pages/StocksPage";

function LegacyJobDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/employers/jobs" replace />;
  return <Navigate to={`/employers/jobs/${id}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/employers/jobs" replace />} />
        <Route path="/employers/signup" element={<EmployerSignupPage />} />
        <Route path="/employers/login" element={<EmployerLoginPage />} />
        <Route element={<RequireEmployerAuth />}>
          <Route path="/employers/jobs" element={<JobListPage />} />
          <Route path="/employers/jobs/:id" element={<JobDetailPage />} />
          <Route path="/employers/stocks" element={<StocksPage />} />
        </Route>
        <Route path="/jobs/:id" element={<LegacyJobDetailRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
