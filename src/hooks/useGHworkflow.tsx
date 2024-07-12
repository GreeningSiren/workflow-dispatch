// src/hooks/useGHworkflow.ts
import { useState, useEffect } from 'react';
import { Octokit } from "@octokit/core";

const octokit = new Octokit({ auth: import.meta.env.GH_TOKEN });

interface Repository {
  name: string;
}

interface Workflow {
  id: number;
  name: string;
  html_url: string;
  repo: string;
}

interface WorkflowAPIResponse {
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

        const workflowPromises = repos.map(async (repo: Repository) => {
          //@ts-expect-error Idk how to fix
          const { data } = await octokit.request<WorkflowAPIResponse>('GET /repos/{owner}/{repo}/actions/workflows', {
            owner: username,
            repo: repo.name,
            headers: {
              'X-GitHub-Api-Version': '2022-11-28',
            }
          });

          return data.workflows.map((workflow: WorkflowAPI) => ({
            id: workflow.id,
            name: workflow.name,
            html_url: workflow.html_url,
            repo: repo.name,
          }));
        });

        const workflowsArray = await Promise.all(workflowPromises);
        setWorkflows(workflowsArray.flat());
        setLoading(false);
      } catch (err) {
        const error = err as Error;
        setError(error.message);
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, [username]);

  const triggerWorkflow = async (repo: string, workflow_id: number) => {
    try {
      await octokit.request('POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches', {
        owner: username,
        repo,
        workflow_id,
        ref: 'master', // or the branch you want to trigger the workflow on
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
          'Accept': 'application/vnd.github+json',
        }
      });
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    }
  };

  return { workflows, loading, error, triggerWorkflow };
};

export default useGHworkflow;
