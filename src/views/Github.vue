<template>
  <div class="page">
    <div class="page-container">
      <div class="page-header">
        <h2>{{ $t("nav.github") }}</h2>
      </div>

      <!-- Connection Card -->
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">
            {{ $t("github.connection") || "GitHub Connection" }}
          </h3>
        </div>
        <div class="github-connect-section">
          <div v-if="!isConnected" class="connect-form">
            <p class="connect-description">
              {{
                $t("github.connectDesc") ||
                "Connect your GitHub account to track your coding activity"
              }}
            </p>
            <div class="token-input-group">
              <input
                type="password"
                v-model="githubToken"
                :placeholder="
                  $t('github.tokenPlaceholder') ||
                  'Enter your Personal Access Token'
                "
                class="input token-input"
              />
              <button class="btn-github" @click="connectGitHub">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="20"
                  height="20"
                >
                  <path
                    d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"
                  />
                </svg>
                {{ $t("github.connect") || "Connect GitHub" }}
              </button>
            </div>
            <p class="token-hint">
              <a href="https://github.com/settings/tokens" target="_blank"
                >{{ $t("github.getToken") || "Get your token here" }} →</a
              >
            </p>
          </div>
          <div v-else class="connected-status">
            <div class="user-info">
              <img :src="githubUser?.avatar_url" class="user-avatar" />
              <div>
                <div class="user-name">
                  {{ githubUser?.name || githubUser?.login }}
                </div>
                <div class="user-login">@{{ githubUser?.login }}</div>
              </div>
            </div>
            <button class="btn-outline" @click="disconnectGitHub">
              {{ $t("github.disconnect") || "Disconnect" }}
            </button>
          </div>
        </div>
      </div>

      <!-- Repositories Section -->
      <div class="card mb-4" v-if="isConnected">
        <div class="card-header flex-between">
          <h3 class="card-title">📁 My Repositories</h3>
          <span class="repo-count">{{ repositories.length }} repos</span>
        </div>
        <div v-if="reposLoading" class="loading-state">
          <div class="spinner"></div>
        </div>
        <div v-else-if="repositories.length > 0" class="repos-grid">
          <div
            v-for="repo in repositories.slice(0, 6)"
            :key="repo.id"
            class="repo-card"
            @click="openRepo(repo.html_url)"
          >
            <div class="repo-header">
              <img
                v-if="repo.owner?.avatar_url"
                :src="repo.owner.avatar_url"
                class="repo-icon"
              />
              <div class="repo-name">{{ repo.name }}</div>
            </div>
            <p class="repo-description">
              {{ repo.description || "No description" }}
            </p>
            <div class="repo-meta">
              <div
                v-if="repo.language"
                class="language-badge"
                :style="{ background: getLanguageColor(repo.language) }"
              >
                {{ repo.language }}
              </div>
              <span class="repo-stars">⭐ {{ repo.stargazers_count }}</span>
              <span class="repo-forks">🍴 {{ repo.forks_count }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>No repositories found</p>
        </div>
      </div>

      <!-- Activity Feed -->
      <div class="card" v-if="isConnected">
        <div class="card-header flex-between">
          <h3 class="card-title">
            {{ $t("github.recentActivity") || "Recent Activity" }}
          </h3>
          <button class="btn-text" @click="refreshActivity">
            🔄 {{ $t("github.refresh") || "Refresh" }}
          </button>
        </div>
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>{{ $t("common.loading") }}</p>
        </div>
        <div v-else-if="events.length > 0" class="activity-list">
          <div v-for="event in events" :key="event.id" class="activity-item">
            <div class="activity-icon" :class="event.type">
              <span v-if="event.type === 'PushEvent'">📤</span>
              <span v-else-if="event.type === 'CreateEvent'">✨</span>
              <span v-else-if="event.type === 'PullRequestEvent'">🔀</span>
              <span v-else-if="event.type === 'IssuesEvent'">📋</span>
              <span v-else>📦</span>
            </div>
            <div class="activity-content">
              <div class="activity-header">
                <span class="repo-name">{{ event.repo.name }}</span>
                <span class="activity-time">{{
                  formatTime(event.created_at)
                }}</span>
              </div>
              <div class="activity-details">
                <template v-if="event.type === 'PushEvent'">
                  <div
                    v-for="commit in event.payload?.commits?.slice(0, 3)"
                    :key="commit.sha"
                    class="commit-item"
                  >
                    <code class="commit-sha">{{
                      commit.sha.substring(0, 7)
                    }}</code>
                    <span class="commit-message">{{ commit.message }}</span>
                  </div>
                  <div v-if="event.payload?.size > 3" class="more-commits">
                    +{{ event.payload.size - 3 }} more commits
                  </div>
                </template>
                <template v-else-if="event.type === 'PullRequestEvent'">
                  <span class="pr-action">{{ event.payload?.action }}</span>
                  <span class="pr-title">{{
                    event.payload?.pull_request?.title
                  }}</span>
                </template>
                <template v-else>
                  <span class="event-action">{{
                    event.payload?.action || event.type.replace("Event", "")
                  }}</span>
                </template>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>{{ $t("github.noActivity") || "No recent activity found" }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { open } from "@tauri-apps/plugin-shell";

interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
}

interface GitHubEvent {
  id: string;
  type: string;
  repo: { name: string };
  created_at: string;
  payload?: any;
}

interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  owner: { avatar_url: string };
}

const githubToken = ref("");
const isConnected = ref(false);
const isLoading = ref(false);
const reposLoading = ref(false);
const githubUser = ref<GitHubUser | null>(null);
const events = ref<GitHubEvent[]>([]);
const repositories = ref<GitHubRepo[]>([]);

// Language colors map
const languageColors: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#ffac45",
  Kotlin: "#A97BFF",
  Vue: "#41b883",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Dart: "#00B4AB",
};

function getLanguageColor(lang: string): string {
  return languageColors[lang] || "#6e7681";
}

function openRepo(url: string) {
  open(url);
}

onMounted(() => {
  const savedToken = localStorage.getItem("github_token");
  if (savedToken) {
    githubToken.value = savedToken;
    loadUserData();
  }
});

async function connectGitHub() {
  if (!githubToken.value) return;

  isLoading.value = true;
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${githubToken.value}` },
    });

    if (response.ok) {
      githubUser.value = await response.json();
      localStorage.setItem("github_token", githubToken.value);
      isConnected.value = true;
      await Promise.all([fetchEvents(), fetchRepositories()]);
    } else {
      alert("Invalid token. Please check and try again.");
    }
  } catch (e) {
    console.error("GitHub connection failed:", e);
  } finally {
    isLoading.value = false;
  }
}

async function loadUserData() {
  isLoading.value = true;
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${githubToken.value}` },
    });

    if (response.ok) {
      githubUser.value = await response.json();
      isConnected.value = true;
      await Promise.all([fetchEvents(), fetchRepositories()]);
    }
  } catch (e) {
    console.error("Failed to load user:", e);
  } finally {
    isLoading.value = false;
  }
}

async function fetchRepositories() {
  if (!githubUser.value) return;

  reposLoading.value = true;
  try {
    const response = await fetch(
      `https://api.github.com/users/${githubUser.value.login}/repos?sort=updated&per_page=20`,
      { headers: { Authorization: `Bearer ${githubToken.value}` } }
    );

    if (response.ok) {
      repositories.value = await response.json();
    }
  } catch (e) {
    console.error("Failed to fetch repos:", e);
  } finally {
    reposLoading.value = false;
  }
}

async function fetchEvents() {
  if (!githubUser.value) return;

  try {
    const response = await fetch(
      `https://api.github.com/users/${githubUser.value.login}/events?per_page=20`,
      {
        headers: { Authorization: `Bearer ${githubToken.value}` },
      }
    );

    if (response.ok) {
      events.value = await response.json();
    }
  } catch (e) {
    console.error("Failed to fetch events:", e);
  }
}

function disconnectGitHub() {
  localStorage.removeItem("github_token");
  githubToken.value = "";
  githubUser.value = null;
  events.value = [];
  isConnected.value = false;
}

async function refreshActivity() {
  isLoading.value = true;
  await fetchEvents();
  isLoading.value = false;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
</script>

<style scoped>
.mb-4 {
  margin-bottom: 24px;
}

.github-connect-section {
  padding: 16px 0;
}

.connect-description {
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.token-input-group {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.token-input {
  flex: 1;
  min-width: 280px;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.9rem;
}

.token-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.btn-github {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: #24292e;
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-github:hover {
  background: #1a1e22;
  transform: translateY(-2px);
}

.btn-github svg {
  fill: currentColor;
}

.token-hint {
  margin-top: 12px;
  font-size: 0.8rem;
}

.token-hint a {
  color: var(--color-primary);
  text-decoration: none;
}

.token-hint a:hover {
  text-decoration: underline;
}

.connected-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid var(--color-primary);
}

.user-name {
  font-weight: 600;
  font-size: 1rem;
}

.user-login {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.activity-icon {
  font-size: 1.25rem;
  width: 32px;
  text-align: center;
}

.activity-content {
  flex: 1;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.repo-name {
  font-weight: 600;
  color: var(--color-primary);
}

.activity-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.commit-item {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 0.85rem;
}

.commit-sha {
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.commit-message {
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;
}

.more-commits {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-style: italic;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  color: var(--text-muted);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}

.btn-text {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 0.875rem;
}

/* Repository Styles */
.repo-count {
  font-size: 0.8rem;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  padding: 4px 10px;
  border-radius: 12px;
}

.repos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.repo-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.repo-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.repo-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.repo-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
}

.repo-card .repo-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
}

.repo-description {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.repo-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.75rem;
}

.language-badge {
  color: white;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 500;
}

.repo-stars,
.repo-forks {
  color: var(--text-muted);
}
</style>
