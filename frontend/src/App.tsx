import "./index.css";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./layouts/layout";
import Dashboard from "./pages/dashboard";
import Login from "./pages/login";
import Signup from "./pages/signup";
import ProjectDocuments from "./pages/project-documents";
import Documents from "./pages/documents";
import Search from "./pages/search";
import RAG from "./pages/rag";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/project/:projectId" element={<ProjectDocuments />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/search" element={<Search />} />
            <Route path="/rag" element={<RAG />} />
            <Route path="/signup" element={<Signup />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
