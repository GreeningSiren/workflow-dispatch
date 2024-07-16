// src/hooks/useGHworkflow.ts
import { useState, useEffect } from 'react';
import { Octokit } from "@octokit/core";

const octokit = new Octokit({ auth: import.meta.env.VITE_GH_TOKEN });

interface Repository {
  name: string;
  default_branch: string;
}

interface Workflow {
  id: number;
  name: string;
  html_url: string;
  repo: string;
}

interface WorkflowAPIResponse {
  total_count: number;
  workflows: WorkflowAPI[];
}

interface WorkflowAPI {
  id: number;
  name: string;
  html_url: string;
}

const useGHworkflow = (username: string) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        //@ts-expect-error Idk how to fix
        const { data: repos } = await octokit.request<Repository[]>('GET /users/{username}/repos', {
          username,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28',
          }
        });

        console.log('Repositories:', repos);

        const allWorkflows: Workflow[] = [];

        for (const repo of repos) {
          try {
            //@ts-expect-error Idk how to fix
            const { data: workflowData } = await octokit.request<WorkflowAPIResponse>('GET /repos/{owner}/{repo}/actions/workflows', {
              owner: username,
              repo: repo.name,
              headers: {
                'X-GitHub-Api-Version': '2022-11-28',
              }
            });

            console.log(`Workflows for ${repo.name}:`, workflowData);

            if (workflowData.workflows && workflowData.workflows.length > 0) {
              //@ts-expect-error Idk how to fix
              const workflowsForRepo = workflowData.workflows.map((workflow) => ({
                id: workflow.id,
                name: workflow.name,
                html_url: workflow.html_url,
                repo: repo.name,
              }));
              allWorkflows.push(...workflowsForRepo);
            } else {
              console.log(`No workflows found for ${repo.name}`);
            }
          } catch (err) {
            const error = err as Error;
            console.error(`Failed to fetch workflows for repo ${repo.name}:`, error.message);
          }
        }

        setWorkflows(allWorkflows);
        setLoading(false);
      } catch (err) {
        const error = err as Error;
        console.error('Failed to fetch repositories:', error.message);
        setError(error.message);
        setTimeout(() => setError(null), 3000);
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, [username]);

  const triggerWorkflow = async (repo: string, workflow_id: number) => {
    try {
      //@ts-expect-error Idk how to fix
      const { data: repoData } = await octokit.request<Repository>('GET /repos/{owner}/{repo}', {
        owner: username,
        repo,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        }
      });

      console.log(`Default branch for ${repo}: ${repoData.default_branch}`);

      await octokit.request('POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches', {
        owner: username,
        repo,
        workflow_id,
        ref: repoData.default_branch, // Use the default branch of the repository
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        }
      });

      console.log(`Triggered workflow ${workflow_id} for repo ${repo}`);
      setError(`Succesfully triggered workflow ${workflow_id} for repo ${repo}`);
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      const error = err as Error;
      console.error(`Failed to trigger workflow for repo ${repo}:`, error.message);
      setError(error.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  return { workflows, loading, error, triggerWorkflow };
};

export default useGHworkflow;
