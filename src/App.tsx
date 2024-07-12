// src/App.tsx
import React, { useState, useEffect } from 'react';
import useGHworkflow from './hooks/useGHworkflow';
import './App.css';

const App: React.FC = () => {
  const { workflows, loading, error, triggerWorkflow } = useGHworkflow('GreeningSiren');
  const [modalOpen, setModalOpen] = useState(false); // State for controlling modal

  // Effect to open modal when error occurs
  useEffect(() => {
    if (error) {
      setModalOpen(true);
    }
  }, [error]);

  const handleTrigger = (repo: string, workflowId: number) => {
    triggerWorkflow(repo, workflowId);
  };

  // Group workflows by repository
  //@ts-expect-error myrzi me da tormozq chatgpt
  const groupedWorkflows: { [key: string]: Workflow[] } = {};
  workflows.forEach((workflow) => {
    if (!groupedWorkflows[workflow.repo]) {
      groupedWorkflows[workflow.repo] = [];
    }
    groupedWorkflows[workflow.repo].push(workflow);
  });

  // Function to close modal
  const closeModal = () => {
    setModalOpen(false);
  };

  // Render modal content
  const renderModalContent = () => (
    <div className="modal" style={{ display: modalOpen ? 'block' : 'none' }}>
      <div className="modal-content">
        <span className="close" onClick={closeModal}>&times;</span>
        <p>Error: {error}</p>
      </div>
    </div>
  );

  return (
    <div className="container">
      <div className="header">
        <h1>GitHub Repository Workflows</h1>
      </div>
      {loading && <div className="loading">Loading...</div>}
      {error && renderModalContent()} {/* Render modal if error exists */}
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
                    <button onClick={() => handleTrigger(workflow.repo, workflow.id)}>
                      Trigger Workflow
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          !loading && <div className="loading">No workflows found.</div>
        )}
      </div>
    </div>
  );
};

export default App;
