// src/hooks/fetchYaml.ts
import yaml from 'js-yaml';

interface Yaml {
  on: object;
}

const fetchYaml = async (owner: string, repo: string, path: string, defaultBranch: string = 'master'): Promise<{ hasWorkflowDispatch: boolean; error: string | null }> => {
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${path}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch YAML file');
    }

    const text = await response.text();
    const data: Yaml = yaml.load(text) as Yaml;

    const hasWorkflowDispatch = data.on && 'workflow_dispatch' in data.on;

    return { hasWorkflowDispatch, error: null };
  } catch (err) {
    const error = err as Error;
    return { hasWorkflowDispatch: false, error: error.message };
  }
};

export default fetchYaml;
