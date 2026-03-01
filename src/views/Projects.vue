<template>
  <div class="page">
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h2>{{ $t("projects.title") }}</h2>
          <p class="subtitle">{{ $t("projects.subtitle") }}</p>
        </div>
      </div>

      <!-- GitHub Connection Section -->
      <div class="connection-card animate-enter">
        <div v-if="!isConnected" class="connect-state">
          <div class="connect-hero">
            <div class="connect-icon-box">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="48"
                height="48"
              >
                <path
                  d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"
                />
              </svg>
            </div>
            <div class="connect-info">
              <h3>{{ $t("projects.connectTitle") }}</h3>
              <p>{{ $t("projects.connectDesc") }}</p>
            </div>
          </div>

          <!-- Direct Sign In Button -->
          <button
            class="btn-github-login"
            @click="loginWithGitHub"
            :disabled="isAuthenticating"
          >
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
            {{
              isAuthenticating
                ? $t("common.loading")
                : $t("projects.signInWithGitHub")
            }}
          </button>

          <p v-if="authError" class="auth-error">{{ authError }}</p>
        </div>

        <!-- Connected State -->
        <div v-else class="connected-state">
          <div class="user-profile">
            <img
              v-if="githubUser?.avatar_url"
              :src="githubUser.avatar_url"
              class="user-avatar"
              alt="avatar"
            />
            <div class="user-details">
              <div class="user-name">
                {{
                  githubUser?.name || githubUser?.login || "GitHub Connected"
                }}
              </div>
              <div class="user-login">@{{ githubUser?.login || "user" }}</div>
            </div>
          </div>
          <button class="btn-disconnect" @click="disconnectGitHub">
            {{ $t("github.disconnect") }}
          </button>
        </div>
      </div>

      <!-- Content (only when connected) -->
      <template v-if="isConnected">
        <!-- Local Boards Section -->
        <div class="boards-section animate-enter" style="animation-delay: 0.1s">
          <div class="section-header">
            <h3>📋 {{ $t("projects.localBoards") }}</h3>
            <button
              class="btn-create-board"
              @click="showCreateForm = !showCreateForm"
            >
              + {{ $t("projects.newBoard") }}
            </button>
          </div>

          <!-- Create Board Form -->
          <div v-if="showCreateForm" class="create-board-form animate-enter">
            <input
              type="text"
              v-model="newBoardName"
              :placeholder="$t('projects.boardNamePlaceholder')"
              class="board-name-input"
              @keyup.enter="createBoard"
            />
            <div class="type-selector">
              <button
                v-for="t in boardTypes"
                :key="t.id"
                class="type-btn"
                :class="{ active: newBoardType === t.id }"
                @click="newBoardType = t.id"
              >
                {{ t.icon }} {{ t.label }}
              </button>
            </div>
            <div class="create-board-actions">
              <button
                class="btn-primary-sm"
                @click="createBoard"
                :disabled="!newBoardName.trim()"
              >
                {{ $t("projects.createBoard") }}
              </button>
              <button
                class="btn-cancel-sm"
                @click="
                  showCreateForm = false;
                  newBoardName = '';
                "
              >
                {{ $t("common.cancel") }}
              </button>
            </div>
          </div>

          <!-- Board Cards -->
          <div v-if="localBoards.length > 0" class="boards-grid">
            <div
              v-for="board in localBoards"
              :key="board.id"
              class="board-card"
              :class="{ active: selectedBoard?.id === board.id }"
              @click="selectBoard(board)"
            >
              <div class="board-card-top">
                <div
                  class="board-icon"
                  :style="{ background: getProjectColor(board.name) }"
                >
                  {{ board.name.charAt(0).toUpperCase() }}
                </div>
                <div class="board-info">
                  <span class="board-name">{{ board.name }}</span>
                  <div class="board-meta-row">
                    <span class="board-type-badge" :class="board.board_type">
                      {{ getBoardTypeIcon(board.board_type) }}
                      {{ board.board_type }}
                    </span>
                    <span
                      class="board-sync-status"
                      :class="board.synced_at ? 'synced' : 'local'"
                    >
                      {{ board.synced_at ? "✅" : "💾" }}
                    </span>
                  </div>
                </div>
                <button
                  class="btn-delete-board"
                  @click.stop="deleteBoard(board.id)"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
              <div class="board-card-footer" v-if="board.github_project_url">
                <a
                  :href="board.github_project_url"
                  @click.stop
                  class="board-github-link"
                >
                  🔗 View on GitHub
                </a>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <div class="empty-icon">📋</div>
            <p>{{ $t("projects.noBoardsYet") }}</p>
            <span>{{ $t("projects.noBoardsDesc") }}</span>
          </div>
        </div>

        <!-- Board Detail View -->
        <div
          v-if="selectedBoard"
          class="board-detail-section animate-enter"
          style="animation-delay: 0.15s"
        >
          <div class="section-header">
            <h3>
              {{ getBoardTypeIcon(selectedBoard.board_type) }}
              {{ selectedBoard.name }}
            </h3>
            <div class="board-actions">
              <template v-if="selectedBoard.board_type === 'activity'">
                <button
                  class="btn-action"
                  @click="recordActivity"
                  :disabled="boardActionsLoading"
                >
                  🔄 {{ $t("projects.recordActivity") }}
                </button>
              </template>
              <button
                class="btn-action sync"
                @click="syncToGitHub"
                :disabled="boardActionsLoading || !isConnected"
              >
                🚀 {{ $t("projects.syncToGitHub") }}
              </button>
            </div>
          </div>

          <p
            v-if="boardActionMessage"
            class="board-message"
            :class="boardActionError ? 'error' : 'success'"
          >
            {{ boardActionMessage }}
          </p>

          <div v-if="boardActionsLoading" class="loading-state">
            <div class="spinner"></div>
            <p>{{ $t("common.loading") }}</p>
          </div>

          <!-- Activity view (existing table) -->
          <template v-else-if="selectedBoard.board_type === 'activity'">
            <div v-if="boardItems.length > 0" class="items-table-wrapper">
              <table class="items-table">
                <thead>
                  <tr>
                    <th>{{ $t("projects.appName") }}</th>
                    <th>{{ $t("projects.windowTitle") }}</th>
                    <th>{{ $t("projects.timeTracked") }}</th>
                    <th>{{ $t("projects.date") }}</th>
                    <th>{{ $t("projects.status") }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in boardItems" :key="item.id">
                    <td class="app-cell">
                      <span
                        class="app-dot"
                        :style="{ background: getProjectColor(item.app_name) }"
                      ></span>
                      {{ item.app_name }}
                    </td>
                    <td class="window-cell">{{ item.window_title || "—" }}</td>
                    <td class="time-cell">
                      {{ formatDuration(item.tracked_seconds) }}
                    </td>
                    <td class="date-cell">{{ item.date }}</td>
                    <td>
                      <span class="status-badge" :class="item.status">{{
                        item.status
                      }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="empty-state small">
              <p>{{ $t("projects.noItems") }}</p>
              <span>{{ $t("projects.noItemsDesc") }}</span>
            </div>
          </template>

          <!-- Table view -->
          <template v-else-if="selectedBoard.board_type === 'table'">
            <div class="task-add-row">
              <input
                type="text"
                v-model="newTaskTitle"
                :placeholder="$t('projects.addTaskPlaceholder')"
                class="task-input"
                @keyup.enter="addTask"
              />
              <select v-model="newTaskPriority" class="priority-select">
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
              <button
                class="btn-primary-sm"
                @click="addTask"
                :disabled="!newTaskTitle.trim()"
              >
                +
              </button>
            </div>

            <div v-if="projectTasks.length > 0" class="items-table-wrapper">
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width: 40px"></th>
                    <th>{{ $t("projects.taskTitle") }}</th>
                    <th>{{ $t("projects.priority") }}</th>
                    <th>{{ $t("projects.status") }}</th>
                    <th style="width: 40px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="task in projectTasks"
                    :key="task.id"
                    :class="{ done: task.status === 'done' }"
                  >
                    <td>
                      <input
                        type="checkbox"
                        :checked="task.status === 'done'"
                        class="task-checkbox"
                        @change="toggleTaskStatus(task)"
                      />
                    </td>
                    <td
                      class="task-title-cell"
                      :class="{ strikethrough: task.status === 'done' }"
                    >
                      {{ task.title }}
                      <span v-if="task.description" class="task-desc">{{
                        task.description
                      }}</span>
                    </td>
                    <td>
                      <span class="priority-badge" :class="task.priority">{{
                        task.priority
                      }}</span>
                    </td>
                    <td>
                      <span class="status-badge" :class="task.status">{{
                        task.status
                      }}</span>
                    </td>
                    <td>
                      <button
                        class="btn-delete-board"
                        @click="removeTask(task.id)"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="empty-state small">
              <p>{{ $t("projects.noTasks") }}</p>
            </div>
          </template>

          <!-- Roadmap view -->
          <template v-else-if="selectedBoard.board_type === 'roadmap'">
            <div class="task-add-row">
              <input
                type="text"
                v-model="newTaskTitle"
                :placeholder="$t('projects.addMilestonePlaceholder')"
                class="task-input"
                @keyup.enter="addTask"
              />
              <input type="date" v-model="newTaskDueDate" class="date-input" />
              <select v-model="newTaskPriority" class="priority-select">
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
              <button
                class="btn-primary-sm"
                @click="addTask"
                :disabled="!newTaskTitle.trim()"
              >
                +
              </button>
            </div>

            <div v-if="projectTasks.length > 0" class="roadmap-timeline">
              <div
                v-for="task in projectTasks"
                :key="task.id"
                class="roadmap-item"
                :class="[task.status, task.priority]"
              >
                <div class="roadmap-dot" :class="task.status"></div>
                <div class="roadmap-content">
                  <div class="roadmap-header">
                    <span
                      class="roadmap-title"
                      :class="{ strikethrough: task.status === 'done' }"
                      >{{ task.title }}</span
                    >
                    <div class="roadmap-actions">
                      <span class="priority-badge" :class="task.priority">{{
                        task.priority
                      }}</span>
                      <select
                        :value="task.status"
                        class="status-select"
                        @change="
                          updateTaskStatusFromSelect(
                            task.id,
                            ($event.target as HTMLSelectElement).value,
                          )
                        "
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                      <button
                        class="btn-delete-board"
                        @click="removeTask(task.id)"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <span v-if="task.due_date" class="roadmap-date"
                    >📅 {{ task.due_date }}</span
                  >
                </div>
              </div>
            </div>
            <div v-else class="empty-state small">
              <p>{{ $t("projects.noMilestones") }}</p>
            </div>
          </template>
        </div>

        <!-- My GitHub Projects V2 -->
        <div
          class="my-projects-section animate-enter"
          style="animation-delay: 0.2s"
        >
          <div class="section-header">
            <h3>{{ $t("projects.myProjects") }}</h3>
            <button
              class="btn-text"
              @click="fetchProjects"
              :disabled="projectsLoading"
            >
              🔄 {{ $t("github.refresh") }}
            </button>
          </div>

          <div v-if="projectsLoading" class="loading-state">
            <div class="spinner"></div>
            <p>{{ $t("common.loading") }}</p>
          </div>

          <div v-else-if="projects.length > 0" class="projects-grid">
            <div
              v-for="project in projects"
              :key="project.id"
              class="project-card"
              @click="openProjectUrl(project.url)"
            >
              <div class="project-card-header">
                <div
                  class="project-icon"
                  :style="{ background: getProjectColor(project.title) }"
                >
                  {{ project.title.charAt(0) }}
                </div>
                <div class="project-meta">
                  <span class="project-title">{{ project.title }}</span>
                  <span
                    class="project-visibility"
                    :class="project.public ? 'public' : 'private'"
                  >
                    {{ project.public ? "🌐 Public" : "🔒 Private" }}
                  </span>
                </div>
              </div>
              <p class="project-short-desc" v-if="project.shortDescription">
                {{ project.shortDescription }}
              </p>
              <div class="project-stats">
                <span class="project-items">
                  📋 {{ project.items?.totalCount || 0 }} items
                </span>
                <span class="project-updated">
                  {{ formatDate(project.updatedAt) }}
                </span>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <div class="empty-icon">📂</div>
            <p>{{ $t("projects.noProjects") }}</p>
            <span>{{ $t("projects.noProjectsDesc") }}</span>
          </div>
        </div>

        <!-- Work Statistics Section -->
        <div
          class="work-stats-section animate-enter"
          style="animation-delay: 0.3s"
        >
          <div class="section-header">
            <h3>{{ $t("projects.workStats") }}</h3>
          </div>

          <div v-if="repoStats.length > 0" class="repo-stats-grid">
            <div
              v-for="stat in repoStats"
              :key="stat.name"
              class="repo-stat-card"
            >
              <div class="repo-stat-header">
                <img
                  v-if="stat.owner_avatar"
                  :src="stat.owner_avatar"
                  class="repo-stat-icon"
                />
                <div class="repo-stat-info">
                  <span class="repo-stat-name">{{ stat.name }}</span>
                  <span
                    class="repo-stat-lang"
                    v-if="stat.language"
                    :style="{ color: getLanguageColor(stat.language) }"
                  >
                    ● {{ stat.language }}
                  </span>
                </div>
              </div>
              <div class="repo-stat-time">
                <span class="time-value">{{
                  formatDuration(stat.workSeconds)
                }}</span>
                <span class="time-label">{{ $t("projects.timeSpent") }}</span>
              </div>
              <div class="repo-stat-bar">
                <div
                  class="repo-stat-fill"
                  :style="{ width: getStatPercent(stat.workSeconds) + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <div class="empty-icon">📊</div>
            <p>{{ $t("projects.noStats") }}</p>
            <span>{{ $t("projects.noStatsDesc") }}</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";

interface GitHubProject {
  id: string;
  title: string;
  shortDescription: string;
  public: boolean;
  url: string;
  updatedAt: string;
  items?: { totalCount: number };
}

interface RepoStat {
  name: string;
  language: string | null;
  owner_avatar: string;
  workSeconds: number;
}

const isConnected = ref(false);
const isAuthenticating = ref(false);
const authError = ref("");

const githubUser = ref<any>(null);
const githubToken = ref("");

const projects = ref<GitHubProject[]>([]);
const projectsLoading = ref(false);
const repoStats = ref<RepoStat[]>([]);

// Board management
interface LocalBoard {
  id: number;
  name: string;
  board_type: string;
  github_project_id: string | null;
  github_project_url: string | null;
  synced_at: string | null;
  created_at: string;
}

interface BoardItemData {
  id: number;
  board_id: number;
  app_name: string;
  window_title: string | null;
  tracked_seconds: number;
  status: string;
  date: string;
  created_at: string;
}

const localBoards = ref<LocalBoard[]>([]);
const selectedBoard = ref<LocalBoard | null>(null);
const boardItems = ref<BoardItemData[]>([]);
const showCreateForm = ref(false);
const newBoardName = ref("");
const newBoardType = ref("activity");
const boardActionsLoading = ref(false);
const boardActionMessage = ref("");
const boardActionError = ref(false);

// Board types
const boardTypes = [
  { id: "activity", icon: "📊", label: "Activity" },
  { id: "table", icon: "📋", label: "Table" },
  { id: "roadmap", icon: "🗺️", label: "Roadmap" },
];

function getBoardTypeIcon(type: string): string {
  return boardTypes.find((t) => t.id === type)?.icon || "📋";
}

// Task management
interface ProjectTaskData {
  id: number;
  board_id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
}

const projectTasks = ref<ProjectTaskData[]>([]);
const newTaskTitle = ref("");
const newTaskPriority = ref("medium");
const newTaskDueDate = ref("");

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
};

function getLanguageColor(lang: string): string {
  return languageColors[lang] || "#6e7681";
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) seconds = 0;
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function getStatPercent(seconds: number): number {
  if (repoStats.value.length === 0) return 0;
  const maxSeconds = Math.max(...repoStats.value.map((s) => s.workSeconds));
  if (maxSeconds === 0) return 0;
  return Math.round((seconds / maxSeconds) * 100);
}

// ── Auth ──

async function loadConnectedAccount() {
  try {
    const account = await invoke<any>("get_github_account_cmd");
    if (account) {
      isConnected.value = true;
      githubToken.value = account.token;

      // Fetch user profile
      await fetchUserProfile();
    }
  } catch {
    isConnected.value = false;
  }
}

async function fetchUserProfile() {
  if (!githubToken.value) return;
  try {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${githubToken.value}`,
        Accept: "application/json",
      },
    });
    if (res.ok) {
      githubUser.value = await res.json();
    }
  } catch (e) {
    console.error("Failed to fetch user profile:", e);
  }
}

async function loginWithGitHub() {
  isAuthenticating.value = true;
  authError.value = "";
  try {
    // This opens the browser for GitHub OAuth
    await invoke<string>("login_github");

    // On success, reload the account
    await loadConnectedAccount();

    if (isConnected.value) {
      await Promise.all([fetchProjects(), fetchWorkStats()]);
    }
  } catch (e: any) {
    console.error("GitHub login failed:", e);
    authError.value =
      typeof e === "string" ? e : "Authentication failed. Please try again.";
  } finally {
    isAuthenticating.value = false;
  }
}

async function disconnectGitHub() {
  try {
    await invoke("remove_github_account_cmd");
    isConnected.value = false;
    githubUser.value = null;
    githubToken.value = "";
    projects.value = [];
    repoStats.value = [];
  } catch (e) {
    console.error("Failed to disconnect:", e);
  }
}

// ── Projects (GraphQL) ──

async function fetchProjects() {
  if (!githubToken.value) return;
  projectsLoading.value = true;

  try {
    const query = `
      query {
        viewer {
          projectsV2(first: 20, orderBy: {field: UPDATED_AT, direction: DESC}) {
            nodes {
              id
              title
              shortDescription
              public
              url
              updatedAt
              items(first: 0) {
                totalCount
              }
            }
          }
        }
      }
    `;

    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken.value}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (res.ok) {
      const data = await res.json();
      projects.value = data.data?.viewer?.projectsV2?.nodes || [];
    }
  } catch (e) {
    console.error("Failed to fetch projects:", e);
  } finally {
    projectsLoading.value = false;
  }
}

function openProjectUrl(url: string) {
  open(url);
}

function getProjectColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 55%, 45%)`;
}

function formatDate(dateStr: string): string {
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

// ── Work Statistics ──

async function fetchWorkStats() {
  if (!githubToken.value) return;

  try {
    // 1. Get user repos
    const res = await fetch(
      `https://api.github.com/user/repos?sort=pushed&per_page=20`,
      {
        headers: {
          Authorization: `Bearer ${githubToken.value}`,
          Accept: "application/json",
        },
      },
    );

    if (!res.ok) return;
    const repos = await res.json();

    // 2. Get today's activity sessions from Tauri
    const sessions: any[] = await invoke("get_today_activity");

    // 3. Match repos to work time (by checking window titles for repo names)
    const stats: RepoStat[] = [];
    for (const repo of repos) {
      const repoName = repo.name.toLowerCase();
      let totalSeconds = 0;

      for (const session of sessions) {
        const title = (session.window_title || "").toLowerCase();
        if (title.includes(repoName)) {
          totalSeconds += session.duration_seconds || 0;
        }
      }

      if (totalSeconds > 0 || repos.indexOf(repo) < 6) {
        stats.push({
          name: repo.name,
          language: repo.language,
          owner_avatar: repo.owner?.avatar_url,
          workSeconds: totalSeconds,
        });
      }
    }

    // Sort by work time descending
    stats.sort((a, b) => b.workSeconds - a.workSeconds);
    repoStats.value = stats.slice(0, 10);
  } catch (e) {
    console.error("Failed to fetch work stats:", e);
  }
}

// ── Board Management ──

async function loadBoards() {
  try {
    localBoards.value = await invoke<LocalBoard[]>("get_project_boards");
  } catch (e) {
    console.error("Failed to load boards:", e);
  }
}

async function createBoard() {
  if (!newBoardName.value.trim()) return;
  try {
    await invoke<number>("create_project_board", {
      name: newBoardName.value.trim(),
      boardType: newBoardType.value,
    });
    newBoardName.value = "";
    newBoardType.value = "activity";
    showCreateForm.value = false;
    await loadBoards();
  } catch (e) {
    console.error("Failed to create board:", e);
  }
}

async function selectBoard(board: LocalBoard) {
  selectedBoard.value = board;
  boardActionMessage.value = "";
  boardActionsLoading.value = true;
  try {
    if (board.board_type === "activity") {
      boardItems.value = await invoke<BoardItemData[]>("get_board_items_cmd", {
        boardId: board.id,
      });
      projectTasks.value = [];
    } else {
      projectTasks.value = await invoke<ProjectTaskData[]>(
        "get_project_tasks_cmd",
        {
          boardId: board.id,
        },
      );
      boardItems.value = [];
    }
  } catch (e) {
    console.error("Failed to load board items:", e);
  } finally {
    boardActionsLoading.value = false;
  }
}

async function deleteBoard(id: number) {
  try {
    await invoke("delete_project_board", { id });
    if (selectedBoard.value?.id === id) {
      selectedBoard.value = null;
      boardItems.value = [];
    }
    await loadBoards();
  } catch (e) {
    console.error("Failed to delete board:", e);
  }
}

async function recordActivity() {
  if (!selectedBoard.value) return;
  boardActionsLoading.value = true;
  boardActionMessage.value = "";
  boardActionError.value = false;
  try {
    const count = await invoke<number>("populate_board_cmd", {
      boardId: selectedBoard.value.id,
    });
    boardItems.value = await invoke<BoardItemData[]>("get_board_items_cmd", {
      boardId: selectedBoard.value.id,
    });
    boardActionMessage.value = `✅ Recorded ${count} apps from today's activity`;
  } catch (e: any) {
    boardActionMessage.value =
      typeof e === "string" ? e : "Failed to record activity";
    boardActionError.value = true;
  } finally {
    boardActionsLoading.value = false;
  }
}

async function syncToGitHub() {
  if (!selectedBoard.value) return;
  boardActionsLoading.value = true;
  boardActionMessage.value = "";
  boardActionError.value = false;
  try {
    const url = await invoke<string>("sync_board_github_cmd", {
      boardId: selectedBoard.value.id,
    });
    boardActionMessage.value = `🚀 Synced to GitHub! Opening project...`;
    await loadBoards();
    const updated = localBoards.value.find(
      (b) => b.id === selectedBoard.value?.id,
    );
    if (updated) selectedBoard.value = updated;
    if (url) open(url);
  } catch (e: any) {
    boardActionMessage.value = typeof e === "string" ? e : "Sync failed";
    boardActionError.value = true;
  } finally {
    boardActionsLoading.value = false;
  }
}

// ── Task Management ──

async function addTask() {
  if (!selectedBoard.value || !newTaskTitle.value.trim()) return;
  try {
    await invoke<number>("add_project_task_cmd", {
      boardId: selectedBoard.value.id,
      title: newTaskTitle.value.trim(),
      description: null,
      priority: newTaskPriority.value,
      dueDate: newTaskDueDate.value || null,
    });
    newTaskTitle.value = "";
    newTaskDueDate.value = "";
    projectTasks.value = await invoke<ProjectTaskData[]>(
      "get_project_tasks_cmd",
      {
        boardId: selectedBoard.value.id,
      },
    );
  } catch (e) {
    console.error("Failed to add task:", e);
  }
}

async function toggleTaskStatus(task: ProjectTaskData) {
  const newStatus = task.status === "done" ? "todo" : "done";
  try {
    await invoke("update_project_task_status_cmd", {
      id: task.id,
      status: newStatus,
    });
    task.status = newStatus;
  } catch (e) {
    console.error("Failed to toggle task:", e);
  }
}

async function removeTask(id: number) {
  if (!selectedBoard.value) return;
  try {
    await invoke("delete_project_task_cmd", { id });
    projectTasks.value = projectTasks.value.filter((t) => t.id !== id);
  } catch (e) {
    console.error("Failed to delete task:", e);
  }
}

async function updateTaskStatusFromSelect(id: number, status: string) {
  try {
    await invoke("update_project_task_status_cmd", { id, status });
    const task = projectTasks.value.find((t) => t.id === id);
    if (task) task.status = status;
  } catch (e) {
    console.error("Failed to update task status:", e);
  }
}

// ── Lifecycle ──

onMounted(async () => {
  await loadConnectedAccount();

  if (isConnected.value) {
    await Promise.all([loadBoards(), fetchProjects(), fetchWorkStats()]);
  }
});
</script>

<style scoped>
.page-header {
  margin-bottom: 28px;
}

.header-left h2 {
  margin-bottom: 4px;
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
}

/* ── Connection Card ── */
.connection-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 28px;
  margin-bottom: 24px;
}

.connect-state {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.connect-hero {
  display: flex;
  align-items: center;
  gap: 20px;
}

.connect-icon-box {
  width: 80px;
  height: 80px;
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.15),
    rgba(139, 92, 246, 0.1)
  );
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-primary);
}

.connect-info h3 {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.connect-info p {
  color: var(--text-muted);
  font-size: 0.95rem;
}

/* Credentials */
.credentials-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 20px;
}

.credentials-note {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 16px;
  padding: 10px 14px;
  background: rgba(99, 102, 241, 0.08);
  border-radius: 10px;
}

.credentials-form {
  display: grid;
  gap: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
}

.input-field {
  padding: 12px 16px;
  background: var(--bg-hover, rgba(255, 255, 255, 0.05));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: var(--text-main);
  font-family: inherit;
  font-size: 0.9rem;
  transition: all 0.15s;
}

.input-field:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(0, 0, 0, 0.2);
}

.credentials-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.btn-save-creds {
  padding: 10px 24px;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save-creds:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.btn-save-creds:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.creds-help-link {
  color: var(--color-primary);
  font-size: 0.85rem;
  text-decoration: none;
}

.creds-help-link:hover {
  text-decoration: underline;
}

/* GitHub Login Button */
.btn-github-login {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  max-width: 320px;
  padding: 14px 28px;
  background: #24292e;
  border: none;
  border-radius: 14px;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-github-login:hover:not(:disabled) {
  background: #1a1e22;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.btn-github-login:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Connected State */
.connected-state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 14px;
}

.user-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid var(--color-primary);
}

.user-name {
  font-weight: 700;
  font-size: 1.1rem;
}

.user-login {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.btn-disconnect {
  padding: 10px 20px;
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  color: #ef4444;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-disconnect:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
}

/* ── Section Shared ── */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.section-header h3 {
  font-size: 1.15rem;
  font-weight: 700;
}

.section-desc {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-top: 4px;
}

.btn-text {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 0.875rem;
}

/* ── Local Boards ── */
.boards-section,
.board-detail-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 28px;
  margin-bottom: 24px;
}

.btn-create-board {
  padding: 8px 18px;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-create-board:hover {
  background: var(--color-primary-dark, #4f46e5);
  transform: translateY(-1px);
}

.create-board-form {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
}

.board-name-input {
  flex: 1;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: var(--text-main);
  font-size: 0.9rem;
  font-family: inherit;
}

.board-name-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.create-board-actions {
  display: flex;
  gap: 8px;
}

.btn-primary-sm {
  padding: 8px 18px;
  background: var(--color-primary);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-primary-sm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel-sm {
  padding: 8px 18px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 0.85rem;
  cursor: pointer;
}

.boards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.board-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.board-card:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}

.board-card.active {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.08);
}

.board-card-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.board-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
  font-size: 1rem;
}

.board-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.board-name {
  font-weight: 600;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.board-sync-status {
  font-size: 0.75rem;
}

.board-sync-status.synced {
  color: #10b981;
}
.board-sync-status.local {
  color: var(--text-muted);
}

.btn-delete-board {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  opacity: 0.4;
  transition: opacity 0.2s;
}

.btn-delete-board:hover {
  opacity: 1;
}

.board-card-footer {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.board-github-link {
  color: var(--color-primary);
  font-size: 0.8rem;
  text-decoration: none;
}

.board-github-link:hover {
  text-decoration: underline;
}

/* Board Actions */
.board-actions {
  display: flex;
  gap: 8px;
}

.btn-action {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: var(--text-main);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

.btn-action.sync {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
  color: #818cf8;
}

.btn-action.sync:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.25);
}

.btn-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.board-message {
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 0.85rem;
  margin-bottom: 16px;
}

.board-message.success {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.board-message.error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* Items Table */
.items-table-wrapper {
  overflow-x: auto;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.items-table thead th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.items-table tbody tr {
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: background 0.15s;
}

.items-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.items-table td {
  padding: 10px 16px;
}

.app-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.app-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.window-cell {
  color: var(--text-muted);
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time-cell {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.date-cell {
  color: var(--text-muted);
}

.status-badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.recorded {
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
}

.status-badge.synced {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.empty-state.small {
  padding: 24px 0;
}

/* ── Type Selector ── */
.type-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.type-btn {
  flex: 1;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: var(--text-muted);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.type-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.type-btn.active {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.4);
  color: #818cf8;
  font-weight: 600;
}

/* Board type badge */
.board-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.board-type-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
  text-transform: capitalize;
}

.board-type-badge.activity {
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
}

.board-type-badge.table {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.board-type-badge.roadmap {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

/* ── Task Input ── */
.task-add-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.task-input {
  flex: 1;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: var(--text-main);
  font-size: 0.85rem;
}

.task-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.priority-select,
.status-select,
.date-input {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: var(--text-main);
  font-size: 0.8rem;
  cursor: pointer;
}

.priority-select:focus,
.status-select:focus,
.date-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* ── Task styles ── */
.task-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #10b981;
  cursor: pointer;
}

.task-title-cell {
  font-weight: 500;
}

.task-title-cell.strikethrough {
  text-decoration: line-through;
  opacity: 0.5;
}

.task-desc {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.items-table tbody tr.done {
  opacity: 0.6;
}

.priority-badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: capitalize;
}

.priority-badge.low {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.priority-badge.medium {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.priority-badge.high {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.status-badge.todo {
  background: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
}

.status-badge.in_progress {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.status-badge.done {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

/* ── Roadmap Timeline ── */
.roadmap-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  padding-left: 24px;
}

.roadmap-timeline::before {
  content: "";
  position: absolute;
  left: 10px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
}

.roadmap-item {
  display: flex;
  gap: 16px;
  padding: 14px 0;
  position: relative;
}

.roadmap-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.3);
  border: 2px solid rgba(148, 163, 184, 0.5);
  position: absolute;
  left: -20px;
  top: 18px;
  z-index: 1;
  transition: all 0.2s;
}

.roadmap-dot.in_progress {
  background: rgba(245, 158, 11, 0.4);
  border-color: #f59e0b;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
}

.roadmap-dot.done {
  background: rgba(16, 185, 129, 0.4);
  border-color: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
}

.roadmap-content {
  flex: 1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 14px 18px;
  transition: all 0.2s;
}

.roadmap-content:hover {
  background: rgba(255, 255, 255, 0.05);
}

.roadmap-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.roadmap-title {
  font-weight: 600;
  font-size: 0.9rem;
}

.roadmap-title.strikethrough {
  text-decoration: line-through;
  opacity: 0.5;
}

.roadmap-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.roadmap-date {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 6px;
  display: block;
}

.my-projects-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 28px;
  margin-bottom: 24px;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.project-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.project-card:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.project-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.project-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.project-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.project-title {
  font-weight: 600;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-visibility {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.project-visibility.public {
  color: #10b981;
}
.project-visibility.private {
  color: #f59e0b;
}

.project-short-desc {
  color: var(--text-muted);
  font-size: 0.85rem;
  line-height: 1.4;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.project-items,
.project-updated {
  opacity: 0.7;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
  color: var(--text-muted);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Create Project Section ── */
.create-project-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 28px;
  margin-bottom: 24px;
}

.create-project-layout {
  display: flex;
  gap: 24px;
}

.template-sidebar {
  width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 12px;
  margin-bottom: 4px;
}

.sidebar-item {
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-left: 3px solid transparent;
  border-radius: 0 8px 8px 0;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
}

.sidebar-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
}

.sidebar-item.active {
  border-left-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.1);
  color: var(--color-primary);
}

.templates-area {
  flex: 1;
}

/* Search Bar */
.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  margin-bottom: 20px;
  color: var(--text-muted);
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-main);
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.templates-section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 16px;
}

/* Templates Grid */
.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.template-card {
  cursor: pointer;
  transition: all 0.25s ease;
  border-radius: 16px;
  overflow: hidden;
}

.template-card:hover {
  transform: translateY(-4px);
}

.template-card:hover .template-preview {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.template-preview {
  border-radius: 14px;
  padding: 16px;
  height: 170px;
  overflow: hidden;
  transition: box-shadow 0.25s;
}

.template-preview-content {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.preview-title {
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.preview-dots span {
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  margin-left: 3px;
}

.preview-body {
  flex: 1;
  overflow: hidden;
}

/* Board preview */
.preview-columns {
  display: flex;
  gap: 8px;
  height: 100%;
}

.preview-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-col-header {
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.preview-col-item {
  height: 20px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
}

/* Table preview */
.preview-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-row {
  height: 14px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
}

.preview-row:first-child {
  background: rgba(255, 255, 255, 0.15);
}

/* Roadmap preview */
.preview-roadmap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 8px;
}

.preview-bar {
  height: 12px;
  background: linear-gradient(
    90deg,
    rgba(99, 102, 241, 0.4),
    rgba(6, 182, 212, 0.3)
  );
  border-radius: 4px;
}

.template-info {
  padding: 12px 4px 4px;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.template-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.template-source {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.template-desc {
  padding: 0 4px;
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.4;
}

/* ── My Projects ── */
.my-projects-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 28px;
  margin-bottom: 24px;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.project-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.project-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.15);
}

.project-card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}

.project-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.project-title {
  font-weight: 600;
  font-size: 1rem;
  display: block;
}

.project-visibility {
  font-size: 0.75rem;
}

.project-visibility.public {
  color: var(--color-success, #10b981);
}

.project-visibility.private {
  color: var(--text-muted);
}

.project-short-desc {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-bottom: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* ── Work Statistics ── */
.work-stats-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 28px;
  margin-bottom: 24px;
}

.repo-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.repo-stat-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 18px;
  transition: all 0.2s;
}

.repo-stat-card:hover {
  background: rgba(255, 255, 255, 0.06);
}

.repo-stat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.repo-stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
}

.repo-stat-name {
  font-weight: 600;
  font-size: 0.95rem;
  display: block;
}

.repo-stat-lang {
  font-size: 0.8rem;
}

.repo-stat-time {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
}

.time-value {
  font-size: 1.4rem;
  font-weight: 700;
}

.time-label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.repo-stat-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.repo-stat-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--color-primary),
    var(--color-accent, #06b6d4)
  );
  border-radius: 3px;
  transition: width 0.5s ease;
}

/* ── Loading & Empty ── */
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
  border: 3px solid var(--border-color, rgba(255, 255, 255, 0.1));
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
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

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
}

.empty-state p {
  margin-bottom: 6px;
  font-weight: 500;
}

.empty-state span {
  font-size: 0.85rem;
  opacity: 0.7;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .create-project-layout {
    flex-direction: column;
  }

  .template-sidebar {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    gap: 8px;
  }

  .sidebar-group {
    flex-direction: row;
    gap: 4px;
    flex-shrink: 0;
  }

  .sidebar-label {
    display: none;
  }

  .sidebar-item {
    border-left: none;
    border-bottom: 3px solid transparent;
    border-radius: 8px 8px 0 0;
    white-space: nowrap;
    padding: 8px 16px;
  }

  .sidebar-item.active {
    border-left-color: transparent;
    border-bottom-color: var(--color-primary);
  }

  .templates-grid {
    grid-template-columns: 1fr;
  }

  .projects-grid {
    grid-template-columns: 1fr;
  }

  .repo-stats-grid {
    grid-template-columns: 1fr;
  }

  .connect-hero {
    flex-direction: column;
    text-align: center;
  }
}
</style>
