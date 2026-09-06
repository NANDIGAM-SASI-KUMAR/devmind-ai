import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { projectsAPI } from '../api/projects.js';
import { useAuth } from './AuthContext.jsx';

const ProjectsContext = createContext(null);

export const ProjectsProvider = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await projectsAPI.list();
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) refresh();
    else {
      setProjects([]);
      setLoading(false);
    }
  }, [user, refresh]);

  const createProject = async (data) => {
    const project = await projectsAPI.create(data);
    setProjects((p) => [project, ...p]);
    return project;
  };

  const removeProject = async (id) => {
    await projectsAPI.remove(id);
    setProjects((p) => p.filter((proj) => proj._id !== id));
  };

  return (
    <ProjectsContext.Provider value={{ projects, loading, refresh, createProject, removeProject }}>
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjects = () => useContext(ProjectsContext);
