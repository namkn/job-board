import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import RequireEmployerAuth from "./components/RequireEmployerAuth";
import EmployerLoginPage from "./pages/EmployerLoginPage";
import EmployerSignupPage from "./pages/EmployerSignupPage";
import JobApplicationsPage from "./pages/JobApplicationsPage";
import JobDetailPage from "./pages/JobDetailPage";
import JobListPage from "./pages/JobListPage";
import PublicJobDetailPage from "./pages/PublicJobDetailPage";
import PublicJobListPage from "./pages/PublicJobListPage";
import StocksPage from "./pages/StocksPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/jobs" replace />} />
        <Route path="/jobs" element={<PublicJobListPage />} />
        <Route path="/jobs/:id" element={<PublicJobDetailPage />} />
        <Route path="/employers/signup" element={<EmployerSignupPage />} />
        <Route path="/employers/login" element={<EmployerLoginPage />} />
        <Route element={<RequireEmployerAuth />}>
          <Route path="/employers/jobs" element={<JobListPage />} />
          <Route
            path="/employers/jobs/:id/applications"
            element={<JobApplicationsPage />}
          />
          <Route path="/employers/jobs/:id" element={<JobDetailPage />} />
          {/* <Route path="/employers/stocks" element={<StocksPage />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
