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
        const { data: repos } = await octokit.request<Repository[]>('GET /users/{username}/repos', {
          username,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28',
          }
        });

        console.log('Repositories:', repos);

        const workflowPromises = repos.map(async (repo) => {
          try {
            const { data: workflowData } = await octokit.request<WorkflowAPI[]>('GET /repos/{owner}/{repo}/actions/workflows', {
              owner: username,
              repo: repo.name,
              headers: {
                'X-GitHub-Api-Version': '2022-11-28',
              }
            });

            console.log(`Workflows for ${repo.name}:`, workflowData);

            if (!Array.isArray(workflowData)) {
              // If workflowData is not an array, repo has no workflows
              return [];
            }

            const workflowsForRepo = workflowData.map((workflow) => ({
              id: workflow.id,
              name: workflow.name,
              html_url: workflow.html_url,
              repo: repo.name,
            }));

            return workflowsForRepo;
          } catch (err) {
            throw new Error(`Failed to fetch workflows for repo ${repo.name}: ${err.message}`);
          }
        });

        const workflowsArray = await Promise.all(workflowPromises);
        const flattenedWorkflows = workflowsArray.flat();
        setWorkflows(flattenedWorkflows);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, [username]);

  const triggerWorkflow = async (repo: string, workflow_id: number) => {
    try {
      const { data: repoData } = await octokit.request<Repository>('GET /repos/{owner}/{repo}', {
        owner: username,
        repo,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        }
      });

      await octokit.request('POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches', {
        owner: username,
        repo,
        workflow_id,
        ref: repoData.default_branch, // Use the default branch of the repository
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        }
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return { workflows, loading, error, triggerWorkflow };
};

export default useGHworkflow;
