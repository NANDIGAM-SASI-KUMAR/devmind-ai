import Project from '../models/Project.js';
import GithubConnection from '../models/GithubConnection.js';

// GET /api/projects/:id/github
// There is no OAuth flow implemented yet, so this always reflects the real
// (currently non-existent) connection state — never a placeholder repo name.
export const getGithubConnection = async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const connection = await GithubConnection.findOne({ project: project._id });
  res.json({
    connected: connection?.connected || false,
    repoFullName: connection?.repoFullName || '',
    connectedAt: connection?.connectedAt || null
  });
};
