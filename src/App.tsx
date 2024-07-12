// src/App.tsx
import React from 'react';
import useGHworkflow from './hooks/useGHworkflow';
import './App.css';

const App: React.FC = () => {
  const username = 'GreeningSiren';
  const { workflows, loading, error, triggerWorkflow } = useGHworkflow(username);

  return (
    <div className="app">
      <h1>GitHub User Workflows</h1>

      {loading && <p>Loading workflows...</p>}
      {error && <p>Error: {error}</p>}

      <div className="workflow-container">
        {workflows.map((workflow) => (
          <div key={workflow.id} className="workflow-card">
            <h3>{workflow.name}</h3>
            <p>Repository: {workflow.repo}</p>
            <a href={workflow.html_url} target="_blank" rel="noopener noreferrer">
              View Workflow
            </a>
            <button onClick={() => triggerWorkflow(workflow.repo, workflow.id)}>Trigger</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
