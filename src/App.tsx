// src/App.tsx
import React, { useState, useEffect } from 'react';
import useGHworkflow from './hooks/useGHworkflow';
import './App.css';

interface Workflow {
  id: number;
  name: string;
  html_url: string;
  repo: string;
}
interface RepositoryWorkflows {
  [repo: string]: Workflow[];
}

const App: React.FC = () => {
  const { workflows, loading, error, triggerWorkflow } = useGHworkflow('GreeningSiren');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (error) {
      setModalOpen(true);
    }
  }, [error]);

  const handleWorkflowTrigger = (repo: string, workflowId: number) => {
    triggerWorkflow(repo, workflowId);
  };

  const groupedWorkflows: RepositoryWorkflows = {};
  workflows.forEach((workflow) => {
    groupedWorkflows[workflow.repo] = groupedWorkflows[workflow.repo] || [];
    groupedWorkflows[workflow.repo].push(workflow);
  });

  const closeModal = () => {
    setModalOpen(false);
  };

  const renderErrorModal = () => (
    <div className="modal" style={{ display: modalOpen ? 'block' : 'none' }}>
      <div className="modal-content">
        <span className="close" onClick={closeModal}>&times;</span>
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <div className="container">
      <div className="header">
        <h1>GitHub Repository Workflows</h1>
      </div>
      {loading && <div className="loading">Loading Workflows...</div>}
      {error && <div className="overlay"></div>}
      {error && renderErrorModal()}
      <div className="repo-list">
        {Object.keys(groupedWorkflows).length > 0 ? (
          Object.keys(groupedWorkflows).map((repoName) => (
            <div key={repoName} className="repo-card">
              <h2>
                <a href={`https://github.com/GreeningSiren/${repoName}`} target="_blank" rel="noopener noreferrer">
                  {repoName}
                </a>
              </h2>
              <ul className="workflow-list">
                {groupedWorkflows[repoName].map((workflow) => (
                  <li key={workflow.id}>
                    <a href={workflow.html_url} target="_blank" rel="noopener noreferrer">
                      {workflow.name}
                    </a>
                    <button onClick={() => handleWorkflowTrigger(repoName, workflow.id)}>
                      Trigger Workflow
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          !loading && <div className="loading">Oops. No workflows found.</div>
        )}
      </div>
    </div>
  );
};

export default App;
