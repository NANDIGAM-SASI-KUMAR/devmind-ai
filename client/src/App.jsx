import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from './context/AuthContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProjectsListPage from './pages/ProjectsListPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import ProjectEntry from './pages/ProjectEntry.jsx';
import TrashPage from './pages/TrashPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import UsagePage from './pages/UsagePage.jsx';
import StudyPlansPage from './pages/StudyPlansPage.jsx';
import StudyPlanDetailPage from './pages/StudyPlanDetailPage.jsx';
import ExaminationsPage from './pages/ExaminationsPage.jsx';
import ExamHistoryPage from './pages/ExamHistoryPage.jsx';
import ExamStartPage from './pages/ExamStartPage.jsx';
import ExamTakingPage from './pages/ExamTakingPage.jsx';
import ExamResultPage from './pages/ExamResultPage.jsx';
import ResultsPage from './pages/ResultsPage.jsx';

const Loader = () => (
  <div className="h-screen flex items-center justify-center mesh-bg">
    <Loader2 className="w-5 h-5 animate-spin text-brand" />
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
      <Route path="/forgot-password" element={<RedirectIfAuth><ForgotPasswordPage /></RedirectIfAuth>} />
      <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/projects" element={<Protected><ProjectsListPage /></Protected>} />
      <Route path="/trash" element={<Protected><TrashPage /></Protected>} />
      <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
      <Route path="/usage" element={<Protected><UsagePage /></Protected>} />
      <Route path="/study-plans" element={<Protected><StudyPlansPage /></Protected>} />
      <Route path="/study-plans/:id" element={<Protected><StudyPlanDetailPage /></Protected>} />
      <Route path="/examinations" element={<Protected><ExaminationsPage /></Protected>} />
      <Route path="/examinations/history" element={<Protected><ExamHistoryPage /></Protected>} />
      <Route path="/examinations/attempts/:attemptId" element={<Protected><ExamTakingPage /></Protected>} />
      <Route path="/examinations/attempts/:attemptId/result" element={<Protected><ExamResultPage /></Protected>} />
      <Route path="/examinations/:examId" element={<Protected><ExamStartPage /></Protected>} />
      <Route path="/results" element={<Protected><ResultsPage /></Protected>} />
      <Route path="/project/:projectId" element={<Protected><ProjectEntry /></Protected>} />
      <Route path="/project/:projectId/c/:conversationId" element={<Protected><ChatPage /></Protected>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
