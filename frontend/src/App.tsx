import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import JobDetailPage from "./pages/JobDetailPage";
import JobListPage from "./pages/JobListPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JobListPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
