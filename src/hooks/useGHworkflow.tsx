// src/hooks/useGHworkflow.ts
import { useState, useEffect } from 'react';
import { Octokit } from "@octokit/core";
import fetchYaml from './FetchYaml.tsx'; // Adjust the path as necessary

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
  default_branch: string;
  path: string;
}

interface WorkflowAPIResponse {
  total_count: number;
  workflows: WorkflowAPI[];
}

interface WorkflowAPI {
  id: number;
  name: string;
  html_url: string;
  path: string;
}

const useGHworkflow = (username: string) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        // Fetch repositories
        //@ts-expect-error It is supposed to be Repository[]
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
            // Fetch repository details to get the default branch
            //@ts-expect-error It's supposed to return
            const { data: repoData } = await octokit.request<Repository>('GET /repos/{owner}/{repo}', {
              owner: username,
              repo: repo.name,
              headers: {
                'X-GitHub-Api-Version': '2022-11-28',
              }
            });

            console.log(`Repository details for ${repo.name}:`, repoData);

            // Fetch workflows for the repository
            //@ts-expect-error It's supposed to return WorkflowAPIResponse
            const { data: workflowData } = await octokit.request<WorkflowAPIResponse>('GET /repos/{owner}/{repo}/actions/workflows', {
              owner: username,
              repo: repo.name,
              headers: {
                'X-GitHub-Api-Version': '2022-11-28',
              }
            });

            console.log(`Workflows for ${repo.name}:`, workflowData);

            // Check each workflow for dispatch capabilities
            for (const workflow of workflowData.workflows) {
              // Special case: skip YAML check if the workflow name is "pages-build-deployment"
              if (workflow.name === 'pages-build-deployment') {
                console.log(`Skipping workflow dispatch check for ${workflow.name} in ${repo.name}`);
                continue; // Skip this workflow
              }

              // Fetch and check the YAML file for `workflow_dispatch`
              const { hasWorkflowDispatch, error: yamlError } = await fetchYaml(username, repo.name, workflow.path, repoData.default_branch);

              if (yamlError) {
                console.error(`Error fetching YAML for workflow ${workflow.name} in ${repo.name}:`, yamlError);
                continue;
              }

              if (hasWorkflowDispatch) {
                allWorkflows.push({
                  id: workflow.id,
                  name: workflow.name,
                  html_url: workflow.html_url,
                  repo: repo.name,
                  default_branch: repoData.default_branch,
                  path: workflow.path,
                });
              }
            }
          } catch (err) {
            const error = err as Error;
            console.error(`Failed to fetch workflows or repository details for repo ${repo.name}:`, error.message);
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

  const triggerWorkflow = async (repo: string, workflow_id: number, default_branch: string) => {
    try {
      await octokit.request('POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches', {
        owner: username,
        repo,
        workflow_id,
        ref: default_branch,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        }
      });

      console.log(`Triggered workflow ${workflow_id} for repo ${repo}`);
      setError(`Successfully triggered workflow ${workflow_id} for repo ${repo}`);
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
