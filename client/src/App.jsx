import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ChatPage from './pages/ChatPage.jsx';

const Loader = () => (
  <div className="h-screen flex items-center justify-center atmosphere">
    <div className="text-center">
      <div className="numeral text-6xl text-signal mb-3 animate-pulse-dot">··</div>
      <div className="label-xs text-ink-faint">LOADING</div>
    </div>
  </div>
);

const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const RedirectIfAuth = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
      <Route path="/signup" element={<RedirectIfAuth><SignupPage /></RedirectIfAuth>} />
      <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/project/:id" element={<Protected><ChatPage /></Protected>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
