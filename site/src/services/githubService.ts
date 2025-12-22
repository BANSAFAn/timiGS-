import type { GithubRelease } from '../i18n/types';

const REPO_OWNER = 'BANSAFAn';
const REPO_NAME = 'timiGS-'; // As per user instruction

export const fetchReleases = async (): Promise<GithubRelease[]> => {
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`);
    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch releases:', error);
    return [];
  }
};