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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
            <div class="connect-info">
              <h3>{{ $t("projects.connectTitle") }}</h3>
              <p>{{ $t("projects.connectDesc") }}</p>
            </div>
          </div>

          <!-- Direct Sign In Button -->
          <button class="btn-github-login" @click="loginWithGitHub" :disabled="isAuthenticating">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            {{ isAuthenticating ? $t("common.loading") : $t("projects.signInWithGitHub") }}
          </button>

          <p v-if="authError" class="auth-error">{{ authError }}</p>
        </div>

        <!-- Connected State -->
        <div v-else class="connected-state">
          <div class="user-profile">
            <div class="user-details">
              <div class="user-name">GitHub Connected</div>
              <div class="user-login">Ready for Work Statistics</div>
            </div>
          </div>
          <button class="btn-disconnect" @click="disconnectGitHub">
            {{ $t("github.disconnect") }}
          </button>
        </div>
      </div>

      <!-- Content (only when connected) -->
      <template v-if="isConnected">
        <!-- Create Project Section -->
        <div class="create-project-section animate-enter" style="animation-delay: 0.1s">
          <div class="section-header">
            <h3>{{ $t("projects.createProject") }}</h3>
            <p class="section-desc">{{ $t("projects.templateDesc") }}</p>
          </div>

          <div class="create-project-layout">
            <!-- Sidebar -->
            <div class="template-sidebar">
              <div class="sidebar-group">
                <span class="sidebar-label">{{ $t("projects.projectTemplates") }}</span>
                <button 
                  class="sidebar-item" 
                  :class="{ active: selectedCategory === 'featured' }"
                  @click="selectedCategory = 'featured'"
                >
                  Featured
                </button>
              </div>
              <div class="sidebar-group">
                <span class="sidebar-label">{{ $t("projects.startFromScratch") }}</span>
                <button 
                  v-for="cat in scratchCategories" 
                  :key="cat.id"
                  class="sidebar-item"
                  :class="{ active: selectedCategory === cat.id }"
                  @click="selectedCategory = cat.id"
                >
                  {{ cat.name }}
                </button>
              </div>
            </div>

            <!-- Templates Grid -->
            <div class="templates-area">
              <div class="search-bar">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input 
                  type="text" 
                  v-model="templateSearch" 
                  :placeholder="$t('projects.searchTemplates')"
                  class="search-input"
                />
              </div>

              <h4 class="templates-section-title">{{ selectedCategory === 'featured' ? 'Featured' : scratchCategories.find(c => c.id === selectedCategory)?.name }}</h4>

              <div class="templates-grid">
                <div
                  v-for="tmpl in filteredTemplates"
                  :key="tmpl.id"
                  class="template-card"
                  @click="openCreateProject(tmpl)"
                >
                  <div class="template-preview" :style="{ background: tmpl.gradient }">
                    <div class="template-preview-content">
                      <div class="preview-header">
                        <span class="preview-title">{{ tmpl.name }}</span>
                        <div class="preview-dots">
                          <span></span><span></span><span></span>
                        </div>
                      </div>
                      <div class="preview-body">
                        <div class="preview-columns" v-if="tmpl.type === 'board'">
                          <div class="preview-col" v-for="n in 4" :key="n">
                            <div class="preview-col-header"></div>
                            <div class="preview-col-item" v-for="m in (3 - n % 2)" :key="m"></div>
                          </div>
                        </div>
                        <div class="preview-table" v-else-if="tmpl.type === 'table'">
                          <div class="preview-row" v-for="n in 5" :key="n"></div>
                        </div>
                        <div class="preview-roadmap" v-else>
                          <div class="preview-bar" v-for="n in 4" :key="n" :style="{ width: (30 + n * 15) + '%' }"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="template-info">
                    <span class="template-name">{{ tmpl.name }}</span>
                    <span class="template-source">• GitHub</span>
                  </div>
                  <p class="template-desc">{{ tmpl.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>


        <!-- Work Statistics Section -->
        <div class="work-stats-section animate-enter" style="animation-delay: 0.3s">
          <div class="section-header">
            <h3>{{ $t("projects.workStats") }}</h3>
          </div>

          <div v-if="repoStats.length > 0" class="repo-stats-grid">
            <div v-for="stat in repoStats" :key="stat.name" class="repo-stat-card">
              <div class="repo-stat-header">
                <img v-if="stat.owner_avatar" :src="stat.owner_avatar" class="repo-stat-icon" />
                <div class="repo-stat-info">
                  <span class="repo-stat-name">{{ stat.name }}</span>
                  <span class="repo-stat-lang" v-if="stat.language" :style="{ color: getLanguageColor(stat.language) }">
                    ● {{ stat.language }}
                  </span>
                </div>
              </div>
              <div class="repo-stat-time">
                <span class="time-value">{{ formatDuration(stat.workSeconds) }}</span>
                <span class="time-label">{{ $t("projects.timeSpent") }}</span>
              </div>
              <div class="repo-stat-bar">
                <div class="repo-stat-fill" :style="{ width: getStatPercent(stat.workSeconds) + '%' }"></div>
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
import { ref, computed, onMounted } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";



interface RepoStat {
  name: string;
  language: string | null;
  owner_avatar: string;
  workSeconds: number;
}

const isConnected = ref(false);
const isAuthenticating = ref(false);
const authError = ref("");

const githubToken = ref("");

const repoStats = ref<RepoStat[]>([]);

const selectedCategory = ref("featured");
const templateSearch = ref("");

const scratchCategories = [
  { id: "table", name: "Table" },
  { id: "board", name: "Board" },
  { id: "roadmap", name: "Roadmap" },
];

const templates = [
  {
    id: "team-planning",
    name: "Team planning",
    description: "Manage your team's work items, plan upcoming cycles, and understand team capacity",
    type: "table",
    category: "featured",
    gradient: "linear-gradient(135deg, #1e3a5f, #2d5a87)",
  },
  {
    id: "kanban",
    name: "Kanban",
    description: "Visualize the status of your project and limit work in progress",
    type: "board",
    category: "featured",
    gradient: "linear-gradient(135deg, #2d3748, #4a5568)",
  },
  {
    id: "feature-release",
    name: "Feature release",
    description: "Manage your team's prioritized work items and track feature releases",
    type: "table",
    category: "featured",
    gradient: "linear-gradient(135deg, #1a365d, #2b6cb0)",
  },
  {
    id: "bug-tracker",
    name: "Bug tracker",
    description: "Track and triage your bugs 🐛",
    type: "board",
    category: "featured",
    gradient: "linear-gradient(135deg, #3c366b, #553c9a)",
  },
  {
    id: "iterative-dev",
    name: "Iterative development",
    description: "Plan your current and upcoming iterations as you work through your prioritized backlog of items",
    type: "board",
    category: "featured",
    gradient: "linear-gradient(135deg, #234e52, #2c7a7b)",
  },
  {
    id: "product-launch",
    name: "Product launch",
    description: "Manage work items across teams and functions when planning for a product launch 🚀",
    type: "table",
    category: "featured",
    gradient: "linear-gradient(135deg, #44337a, #6b46c1)",
  },
  {
    id: "roadmap",
    name: "Roadmap",
    description: "Manage your team's long term plans as you plan out your roadmap",
    type: "roadmap",
    category: "featured",
    gradient: "linear-gradient(135deg, #1a365d, #3182ce)",
  },
  {
    id: "team-retro",
    name: "Team retrospective",
    description: "Reflect as a team what went well, what can be improved next time, and action items",
    type: "board",
    category: "featured",
    gradient: "linear-gradient(135deg, #22543d, #38a169)",
  },
];

const filteredTemplates = computed(() => {
  let results = templates;
  
  if (selectedCategory.value === "featured") {
    results = templates.filter(t => t.category === "featured");
  } else {
    results = templates.filter(t => t.type === selectedCategory.value);
  }

  if (templateSearch.value) {
    const q = templateSearch.value.toLowerCase();
    results = results.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }

  return results;
});

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
  const maxSeconds = Math.max(...repoStats.value.map(s => s.workSeconds));
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
    }
  } catch {
    isConnected.value = false;
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
      await fetchWorkStats();
    }
  } catch (e: any) {
    console.error("GitHub login failed:", e);
    authError.value = typeof e === 'string' ? e : "Authentication failed. Please try again.";
  } finally {
    isAuthenticating.value = false;
  }
}

async function disconnectGitHub() {
  try {
    await invoke("remove_github_account_cmd");
    isConnected.value = false;
    githubToken.value = "";
    repoStats.value = [];
  } catch (e) {
    console.error("Failed to disconnect:", e);
  }
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
      }
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



function openCreateProject(_tmpl: any) {
  open("https://github.com/new/project");
}

// ── Lifecycle ──

onMounted(async () => {
  await loadConnectedAccount();
  
  if (isConnected.value) {
    await fetchWorkStats();
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
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1));
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
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.4), rgba(6, 182, 212, 0.3));
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
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent, #06b6d4));
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
  to { transform: rotate(360deg); }
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
