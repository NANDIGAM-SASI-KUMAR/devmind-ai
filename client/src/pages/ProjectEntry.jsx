import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { conversationsAPI } from '../api/conversations.js';
import AppShell from '../components/shell/AppShell.jsx';

// Resolves /project/:projectId to its most recent conversation, creating one if needed.
export default function ProjectEntry() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const resolving = useRef(false);

  useEffect(() => {
    if (resolving.current) return;
    resolving.current = true;

    (async () => {
      try {
        const conversations = await conversationsAPI.list(projectId);
        const target = conversations[0] || (await conversationsAPI.create(projectId));
        navigate(`/project/${projectId}/c/${target._id}`, { replace: true });
      } catch (err) {
        console.error(err);
        navigate('/projects', { replace: true });
      }
    })();
  }, [projectId, navigate]);

  return (
    <AppShell>
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-brand" />
      </div>
    </AppShell>
  );
}
