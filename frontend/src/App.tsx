import "./index.css";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./layouts/layout";
import Dashboard from "./pages/dashboard";
import Login from "./pages/login";
import Signup from "./pages/signup";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
