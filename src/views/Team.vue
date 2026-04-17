<template>
  <div class="page page-shell team-page">
    <div class="page-container">
      <div class="page-header">
        <h2>{{ $t('team.title') || 'Team' }}</h2>
        <p class="subtitle">{{ $t('team.subtitle') || 'Collaborate and track team activity' }}</p>
      </div>

      <!-- ===== NOT IN A GROUP: JOIN / CREATE ===== -->
      <div v-if="!isInGroup" class="team-join-card animate-enter">
        <div class="join-card-header">
          <div class="join-icon" v-html="Icons.team"></div>
          <h3>{{ $t('team.joinOrCreate') || 'Join or Create a Group' }}</h3>
          <p class="join-desc">Connect with your team via P2P and see real-time activity</p>
        </div>

        <div class="join-actions">
          <!-- Create New Group -->
          <div class="join-section">
            <h4>{{ $t('team.createGroup') || 'Create New Group' }}</h4>
            <div class="input-group">
              <input
                v-model="newGroupName"
                type="text"
                :placeholder="$t('team.groupNamePlaceholder') || 'Enter group name...'"
                class="modern-input"
                @keyup.enter="handleCreateGroup"
              />
              <button class="btn btn-primary" @click="handleCreateGroup" :disabled="creating || !newGroupName.trim()">
                <span v-html="Icons.plus"></span>
                {{ creating ? 'Creating...' : ($t('team.create') || 'Create') }}
              </button>
            </div>
          </div>

          <div class="join-divider">
            <span>{{ $t('team.or') || 'OR' }}</span>
          </div>

          <!-- Join Existing Group -->
          <div class="join-section">
            <h4>{{ $t('team.joinGroup') || 'Join Existing Group' }}</h4>
            <div class="input-group">
              <input
                v-model="joinGroupCode"
                type="text"
                :placeholder="$t('team.groupCodePlaceholder') || 'Enter group code...'"
                class="modern-input"
                @keyup.enter="handleJoinGroup"
                :disabled="joining"
              />
              <button class="btn btn-secondary" @click="handleJoinGroup" :disabled="joining || !joinGroupCode.trim()">
                <span v-html="Icons.join"></span>
                {{ joining ? 'Joining...' : ($t('team.join') || 'Join') }}
              </button>
            </div>
            <p v-if="joinError" class="error-text">{{ joinError }}</p>
          </div>
        </div>
      </div>

      <!-- ===== IN A GROUP: DASHBOARD ===== -->
      <div v-else class="team-dashboard animate-enter">
        <!-- Group Header -->
        <div class="group-header-card">
          <div class="group-info">
            <div class="group-icon" v-html="Icons.team"></div>
            <div class="group-details">
              <h3>{{ groupName }}</h3>
              <p class="group-code">
                {{ $t('team.groupCode') || 'Group Code' }}:
                <code class="code-badge" @click="copyGroupCode">{{ groupCode }}</code>
                <span v-if="copied" class="copied-text">{{ $t('team.copied') || 'Copied!' }}</span>
              </p>
            </div>
          </div>
          <div class="group-actions">
            <button class="btn btn-secondary" @click="handleDownloadGroupReport" :disabled="members.length === 0">
              <span v-html="Icons.download"></span>
              {{ $t('team.downloadAll') || 'Download All' }}
            </button>
            <button class="btn btn-danger" @click="handleLeaveGroup">
              <span v-html="Icons.close"></span>
              {{ $t('team.leave') || 'Leave' }}
            </button>
          </div>
        </div>

        <!-- Members List -->
        <div class="members-section">
          <div class="section-header">
            <h4>{{ $t('team.members') || 'Members' }} ({{ members.length }})</h4>
            <div class="connection-status" :class="{ connected: isConnected }">
              <span class="status-dot"></span>
              {{ isConnected ? ($t('team.connected') || 'Connected') : ($t('team.connecting') || 'Connecting...') }}
            </div>
          </div>

          <div class="members-grid">
            <!-- Current User Card -->
            <div class="member-card current-user">
              <div class="member-avatar">
                <span class="avatar-letter">{{ currentUserInitial }}</span>
              </div>
              <div class="member-info">
                <div class="member-name">{{ currentUserName }} ({{ $t('team.you') || 'You' }})</div>
                <div class="member-status">
                  <span class="status-indicator online"></span>
                  {{ currentApp || ($t('team.noActivity') || 'No activity') }}
                </div>
                <div class="member-time">{{ currentTimeSpent }}</div>
              </div>
              <div class="member-badge current" v-html="Icons.check"></div>
            </div>

            <!-- Other Members -->
            <div
              v-for="member in otherMembers"
              :key="member.id"
              class="member-card"
              :class="{ offline: member.status === 'offline' }"
            >
              <div class="member-avatar" :style="{ background: memberColor(member.id) }">
                <span class="avatar-letter">{{ member.name.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="member-info">
                <div class="member-name">
                  {{ member.name }}
                  <span v-if="member.isLeader" class="leader-badge" v-html="Icons.team"></span>
                </div>
                <div class="member-status">
                  <span class="status-indicator" :class="member.status === 'offline' ? 'offline' : 'online'"></span>
                  {{ member.currentApp || ($t('team.noActivity') || 'No activity') }}
                </div>
                <div class="member-time">{{ formatDuration(member.totalOnlineSeconds) }}</div>
              </div>
              <div class="member-actions">
                <button class="btn-icon" @click="handleDownloadMemberReport(member)" :title="$t('team.downloadReport') || 'Download Report'">
                  <span v-html="Icons.download"></span>
                </button>
                <button class="btn-icon" @click="viewMemberHistory(member)" :title="$t('team.viewHistory') || 'View History'">
                  <span v-html="Icons.timeline"></span>
                </button>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="otherMembers.length === 0" class="empty-members">
              <div class="empty-icon" v-html="Icons.team"></div>
              <p>{{ $t('team.noMembers') || 'No other members yet' }}</p>
              <p class="empty-hint">{{ $t('team.shareCode') || 'Share the group code to invite others' }}</p>
            </div>
          </div>
        </div>

        <!-- ===== TABS: STATS / RANKING ===== -->
        <div class="tabs-section">
          <div class="tabs-header-row">
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'stats' }"
              @click="activeTab = 'stats'"
            >
              <span v-html="Icons.chart"></span>
              {{ $t('team.stats') || 'Statistics' }}
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'ranking' }"
              @click="activeTab = 'ranking'"
            >
              <span v-html="Icons.fire"></span>
              {{ $t('team.ranking') || 'Online Time Ranking' }}
            </button>
          </div>

          <!-- Stats Tab -->
          <div v-if="activeTab === 'stats'" class="tab-content-area">
            <!-- Team Summary -->
            <div class="summary-stats">
              <div class="stat-item">
                <div class="stat-icon" v-html="Icons.clock"></div>
                <div class="stat-content">
                  <span class="stat-value">{{ formatDuration(teamStats.totalOnlineSeconds) }}</span>
                  <span class="stat-label">{{ $t('team.totalTime') || 'Total Team Time' }}</span>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon" v-html="Icons.chart"></div>
                <div class="stat-content">
                  <span class="stat-value">{{ teamStats.topApp }}</span>
                  <span class="stat-label">{{ $t('team.topApp') || 'Top App' }}</span>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon" v-html="Icons.team"></div>
                <div class="stat-content">
                  <span class="stat-value">{{ teamStats.onlineMembers }} / {{ teamStats.totalMembers }}</span>
                  <span class="stat-label">{{ $t('team.online') || 'Online' }}</span>
                </div>
              </div>
            </div>

            <!-- Per-member stats -->
            <div class="member-stats-grid">
              <div v-for="member in members" :key="member.id" class="member-stat-card">
                <div class="msc-header">
                  <div class="msc-avatar" :style="{ background: memberColor(member.id) }">
                    {{ member.name.charAt(0).toUpperCase() }}
                  </div>
                  <div class="msc-name">{{ member.name }} <span v-if="member.isLeader">(Leader)</span></div>
                </div>
                <div class="msc-stats">
                  <div class="msc-stat">
                    <span class="msc-label">Online</span>
                    <span class="msc-value">{{ formatDuration(member.totalOnlineSeconds) }}</span>
                  </div>
                  <div class="msc-stat">
                    <span class="msc-label">Top App</span>
                    <span class="msc-value">{{ getMemberTopApp(member.id) }}</span>
                  </div>
                  <div class="msc-stat">
                    <span class="msc-label">Sessions</span>
                    <span class="msc-value">{{ member.activityHistory.length }}</span>
                  </div>
                </div>
                <!-- Category breakdown bar -->
                <div v-if="getMemberCategoryBreakdown(member.id).length > 0" class="msc-categories">
                  <div
                    v-for="cat in getMemberCategoryBreakdown(member.id)"
                    :key="cat.category"
                    class="msc-cat-bar"
                    :style="{ width: cat.percentage + '%', background: cat.color }"
                    :title="`${cat.category}: ${cat.percentage}%`"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Ranking Tab -->
          <div v-if="activeTab === 'ranking'" class="tab-content-area">
            <div class="ranking-list">
              <div
                v-for="entry in onlineRanking"
                :key="entry.memberId"
                class="ranking-item"
                :class="{ 'is-you': entry.memberId === myProfile.id }"
              >
                <div class="ranking-rank">
                  <span v-if="entry.rank === 1" class="rank-medal gold">🥇</span>
                  <span v-else-if="entry.rank === 2" class="rank-medal silver">🥈</span>
                  <span v-else-if="entry.rank === 3" class="rank-medal bronze">🥉</span>
                  <span v-else class="rank-number">{{ entry.rank }}</span>
                </div>
                <div class="ranking-avatar" :style="{ background: memberColor(entry.memberId) }">
                  {{ entry.memberName.charAt(0).toUpperCase() }}
                </div>
                <div class="ranking-info">
                  <div class="ranking-name">
                    {{ entry.memberName }}
                    <span v-if="entry.memberId === myProfile.id" class="you-tag">{{ $t('team.you') || 'You' }}</span>
                  </div>
                  <div class="ranking-detail">{{ formatDuration(entry.totalOnlineSeconds) }}</div>
                </div>
                <div class="ranking-bar-wrap">
                  <div
                    class="ranking-bar"
                    :style="{ width: getRankingBarWidth(entry.totalOnlineSeconds) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
            <div v-if="onlineRanking.length === 0" class="empty-ranking">
              <p>{{ $t('team.noData') || 'No ranking data yet' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== MEMBER HISTORY MODAL ===== -->
    <div v-if="showHistoryModal" class="modal-overlay" @click.self="showHistoryModal = false">
      <div class="modal-content history-modal">
        <div class="modal-header">
          <h3>{{ selectedMember?.name }} — {{ $t('team.todayHistory') || "Today's History" }}</h3>
          <button class="close-btn" @click="showHistoryModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedMemberHistory.length > 0" class="history-list">
            <div v-for="session in selectedMemberHistory" :key="session.id" class="history-item">
              <div class="history-time">{{ formatTimestamp(session.startTime) }}</div>
              <div class="history-content">
                <div class="history-app">{{ session.appName }}</div>
                <div class="history-title">{{ session.windowTitle || session.category }}</div>
              </div>
              <div class="history-duration">{{ formatDuration(session.durationSeconds) }}</div>
              <span class="history-category-badge" :style="{ background: getCategoryColor(session.category) }">
                {{ session.category }}
              </span>
            </div>
          </div>
          <div v-else class="empty-history">
            <p>{{ $t('team.noHistory') || 'No activity recorded yet' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== MEMBER STATS MODAL ===== -->
    <div v-if="showStatsModal" class="modal-overlay" @click.self="showStatsModal = false">
      <div class="modal-content stats-modal">
        <div class="modal-header">
          <h3>{{ statsMember?.name }} — {{ $t('team.stats') || 'Statistics' }}</h3>
          <button class="close-btn" @click="showStatsModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="statsMemberData" class="stats-detail">
            <div class="stats-overview">
              <div class="so-item">
                <span class="so-label">Total Online</span>
                <span class="so-value">{{ formatDuration(statsMemberData.totalOnlineSeconds) }}</span>
              </div>
              <div class="so-item">
                <span class="so-label">Active Duration</span>
                <span class="so-value">{{ formatDuration(statsMemberData.activeDuration / 1000) }}</span>
              </div>
            </div>
            <h4>Top Applications</h4>
            <div class="top-apps-list">
              <div v-for="(app, i) in statsMemberData.topApps" :key="app.appName" class="top-app-row">
                <span class="ta-rank">#{{ i + 1 }}</span>
                <span class="ta-name">{{ app.appName }}</span>
                <span class="ta-bar-wrap">
                  <span class="ta-bar" :style="{ width: app.percentage + '%' }"></span>
                </span>
                <span class="ta-time">{{ formatDuration(app.totalSeconds) }}</span>
              </div>
            </div>
            <h4>Category Breakdown</h4>
            <div class="category-pie">
              <div v-for="cat in statsMemberData.categoryBreakdown" :key="cat.category" class="cat-row">
                <span class="cat-dot" :style="{ background: cat.color }"></span>
                <span class="cat-name">{{ cat.category }}</span>
                <span class="cat-bar-wrap">
                  <span class="cat-bar" :style="{ width: cat.percentage + '%', background: cat.color }"></span>
                </span>
                <span class="cat-pct">{{ cat.percentage }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { Icons } from '../components/icons/IconMap';
import { useActivityStore, detectCategory } from '../stores/activity';
import { useTeamsStore } from '../stores/teams';
import { getConfirmDialog } from '../composables/useConfirmDialog';
import { useTeamNotification } from '../composables/useTeamNotification';

const activityStore = useActivityStore();
const teamsStore = useTeamsStore();
const { reportDownloaded: notifyReportDownloaded } = useTeamNotification();

// ==================== STATE ====================
const isInGroup = ref(false);
const groupName = ref('');
const groupCode = ref('');
const newGroupName = ref('');
const joinGroupCode = ref('');
const copied = ref(false);
const creating = ref(false);
const joining = ref(false);
const joinError = ref('');
const showHistoryModal = ref(false);
const showStatsModal = ref(false);
const selectedMember = ref<any>(null);
const selectedMemberHistory = ref<any[]>([]);
const statsMember = ref<any>(null);
const statsMemberData = ref<any>(null);
const activeTab = ref<'stats' | 'ranking'>('stats');
const activityPollInterval = ref<number | null>(null);
const lastActivityApp = ref('');

// ==================== COMPUTED ====================
const myProfile = computed(() => teamsStore.myProfile);
const members = computed(() => teamsStore.members);
const isConnected = computed(() => teamsStore.isConnected);

const currentUserName = computed(() => myProfile.value.name || 'You');
const currentUserInitial = computed(() => currentUserName.value.charAt(0).toUpperCase());

const otherMembers = computed(() => members.value.filter(m => m.id !== myProfile.value.id));

const currentApp = computed(() => {
  const self = members.value.find(m => m.id === myProfile.value.id);
  return self?.currentApp || '';
});

const currentTimeSpent = computed(() => {
  const self = members.value.find(m => m.id === myProfile.value.id);
  if (!self) return '0m';
  return formatDuration(self.totalOnlineSeconds);
});

const teamStats = computed(() => teamsStore.getTeamStats());
const onlineRanking = computed(() => teamsStore.getOnlineTimeRanking());

const maxOnlineSeconds = computed(() => {
  if (onlineRanking.value.length === 0) return 1;
  return Math.max(...onlineRanking.value.map(e => e.totalOnlineSeconds), 1);
});

// ==================== METHODS ====================

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function memberColor(id: string): string {
  // Deterministic color from id
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
  return colors[Math.abs(hash) % colors.length];
}

function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    Work: 'rgba(91,110,225,0.2)',
    Game: 'rgba(239,68,68,0.2)',
    Rest: 'rgba(16,185,129,0.2)',
    Programs: 'rgba(139,92,246,0.2)',
    Uncategorized: 'rgba(107,114,128,0.2)'
  };
  return map[category] || map['Uncategorized'];
}

function getMemberTopApp(memberId: string): string {
  const stats = teamsStore.getMemberStats(memberId);
  if (!stats || stats.topApps.length === 0) return '—';
  return stats.topApps[0].appName;
}

function getMemberCategoryBreakdown(memberId: string): any[] {
  const stats = teamsStore.getMemberStats(memberId);
  return stats?.categoryBreakdown || [];
}

function getRankingBarWidth(seconds: number): number {
  if (maxOnlineSeconds.value === 0) return 0;
  return Math.round((seconds / maxOnlineSeconds.value) * 100);
}

// ===== GROUP ACTIONS =====

async function handleCreateGroup() {
  if (!newGroupName.value.trim()) return;
  creating.value = true;
  try {
    const result = await teamsStore.createGroup(newGroupName.value);
    groupCode.value = result.groupCode;
    groupName.value = result.groupName;
    isInGroup.value = true;
  } catch (e) {
    console.error('Failed to create group:', e);
  }
  creating.value = false;
}

async function handleJoinGroup() {
  if (!joinGroupCode.value.trim()) return;
  joining.value = true;
  joinError.value = '';
  try {
    const success = await teamsStore.joinGroupByCode(joinGroupCode.value.trim());
    if (success) {
      groupName.value = teamsStore.groupName || 'Team Group';
      groupCode.value = teamsStore.groupCode;
      isInGroup.value = true;
    } else {
      joinError.value = 'Group not found. Check the code and try again.';
    }
  } catch (e) {
    joinError.value = 'Failed to join group. Please try again.';
    console.error(e);
  }
  joining.value = false;
}

async function handleLeaveGroup() {
  const confirmed = await getConfirmDialog().confirm({
    title: 'Leave Group?',
    message: 'Are you sure you want to leave this group? You will lose connection to all members.',
    confirmText: 'Leave',
    cancelText: 'Cancel',
    type: 'warning'
  });
  if (confirmed) {
    teamsStore.leaveGroup();
    isInGroup.value = false;
    groupName.value = '';
    groupCode.value = '';
  }
}

function copyGroupCode() {
  navigator.clipboard.writeText(groupCode.value);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}

// ===== REPORT DOWNLOADS =====

function handleDownloadGroupReport() {
  const report = teamsStore.generateGroupReport();
  teamsStore.downloadReport(report);
}

async function handleDownloadMemberReport(member: any) {
  const report = teamsStore.generateMemberReport(member.id);
  if (!report) return;

  // Notify the member that their report was downloaded
  teamsStore.notifyReportDownloaded(member.id);
  notifyReportDownloaded(myProfile.value.name || 'Someone');

  teamsStore.downloadReport(report);
}

// ===== MEMBER HISTORY =====

function viewMemberHistory(member: any) {
  selectedMember.value = member;
  selectedMemberHistory.value = [...member.activityHistory].reverse();
  showHistoryModal.value = true;
}

// ===== ACTIVITY TRACKING =====

function pollCurrentActivity() {
  const current = activityStore.currentActivity;
  if (!current) return;

  const appName = current.app_name || 'Unknown';

  if (appName !== lastActivityApp.value) {
    // App changed — send the previous session
    if (lastActivityApp.value) {
      const self = members.value.find(m => m.id === myProfile.value.id);
      if (self) {
        // Find the last incomplete entry (scan from end)
        let lastEntry = null;
        for (let i = self.activityHistory.length - 1; i >= 0; i--) {
          if (self.activityHistory[i].appName === lastActivityApp.value && self.activityHistory[i].durationSeconds === 0) {
            lastEntry = self.activityHistory[i];
            break;
          }
        }
        if (lastEntry) {
          lastEntry.endTime = Date.now();
          lastEntry.durationSeconds = Math.floor((lastEntry.endTime - lastEntry.startTime) / 1000);
          self.totalOnlineSeconds += lastEntry.durationSeconds;
          // Broadcast the completed session
          teamsStore.broadcastActivitySession(lastEntry);
        }
      }
    }

    // Determine category from the app name
    const category = detectCategory(appName, current.exe_path || '');

    // Start new entry
    const entry = {
      id: `${myProfile.value.id}-${Date.now()}`,
      appName,
      windowTitle: current.window_title || '',
      category,
      startTime: Date.now(),
      endTime: Date.now(),
      durationSeconds: 0
    };

    const self = members.value.find(m => m.id === myProfile.value.id);
    if (self) {
      self.activityHistory.push(entry);
      self.currentApp = appName;
    }

    // Broadcast current app
    teamsStore.broadcastActivity({ appName, windowTitle: current.window_title || '', category });

    lastActivityApp.value = appName;
  }
}

function startActivityPolling() {
  pollCurrentActivity();
  activityPollInterval.value = window.setInterval(pollCurrentActivity, 10000); // every 10s
}

function stopActivityPolling() {
  if (activityPollInterval.value) {
    clearInterval(activityPollInterval.value);
    activityPollInterval.value = null;
  }
}

// ===== LIFECYCLE =====

onMounted(async () => {
  // Ensure profile name is set (fetches computer name if empty)
  await teamsStore.ensureProfile();

  // Try to restore previous group session
  const restored = await teamsStore.restoreGroupState();
  if (restored) {
    groupName.value = teamsStore.groupName;
    groupCode.value = teamsStore.groupCode;
    isInGroup.value = true;
    startActivityPolling();
  }
});

onUnmounted(() => {
  stopActivityPolling();
});

// Start activity polling when entering group
watch(isInGroup, (inGroup) => {
  if (inGroup) {
    startActivityPolling();
  } else {
    stopActivityPolling();
  }
});
</script>

<style scoped>
/* ========== PAGE LAYOUT ========== */
.team-page {
  padding-bottom: 40px;
}

.page-container {
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 8px;
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
}

/* ========== JOIN CARD ========== */
.team-join-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: 40px;
  max-width: 600px;
  margin: 0 auto;
}

.join-card-header {
  text-align: center;
  margin-bottom: 32px;
}

.join-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: white;
}

.join-icon :deep(svg) {
  width: 32px;
  height: 32px;
}

.join-card-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 8px;
}

.join-desc {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.join-actions {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.join-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 24px;
  transition: all 0.3s ease;
}

.join-section:hover {
  border-color: var(--color-primary);
  background: var(--bg-tertiary);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.join-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 16px;
}

.input-group {
  display: flex;
  gap: 12px;
}

.modern-input {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 10px 16px;
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
  outline: none;
  font-size: 0.95rem;
  width: 100%;
}

.modern-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(91, 110, 225, 0.2);
  background: var(--bg-tertiary);
}

.input-group .modern-input {
  flex: 1;
}

.input-group .btn {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.error-text {
  color: var(--color-danger, #ef4444);
  font-size: 0.85rem;
  margin-top: 8px;
}

.join-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.join-divider::before,
.join-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

/* ========== GROUP HEADER CARD ========== */
.team-dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.group-header-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.group-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.group-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.group-icon :deep(svg) {
  width: 28px;
  height: 28px;
}

.group-details h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 4px;
}

.group-code {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.code-badge {
  background: var(--bg-tertiary);
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  font-family: monospace;
  font-size: 0.95rem;
  color: var(--color-primary);
  cursor: pointer;
  transition: var(--transition-fast);
  user-select: none;
}

.code-badge:hover {
  background: var(--bg-hover);
}

.copied-text {
  margin-left: 8px;
  color: var(--color-success);
  font-size: 0.85rem;
}

.group-actions {
  display: flex;
  gap: 12px;
}

.group-actions .btn {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ========== MEMBERS SECTION ========== */
.members-section {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-header h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-main);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.connection-status.connected {
  color: var(--color-success);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-warning);
  animation: pulse 2s ease-in-out infinite;
}

.connection-status.connected .status-dot {
  background: var(--color-success);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ========== MEMBERS GRID ========== */
.members-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  transition: var(--transition-fast);
}

.member-card:hover {
  border-color: var(--color-primary);
  background: var(--bg-tertiary);
}

.member-card.current-user {
  background: linear-gradient(135deg, rgba(91, 110, 225, 0.08), rgba(139, 92, 246, 0.08));
  border-color: var(--color-primary);
}

.member-card.offline {
  opacity: 0.6;
}

.member-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-letter {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-main);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.leader-badge {
  width: 16px;
  height: 16px;
  color: var(--color-primary);
}

.leader-badge :deep(svg) {
  width: 16px;
  height: 16px;
}

.member-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-indicator.online {
  background: var(--color-success);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}

.status-indicator.offline {
  background: var(--text-muted);
}

.member-time {
  font-size: 0.8rem;
  color: var(--color-primary);
  font-weight: 500;
}

.member-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-success);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.member-badge.current {
  background: var(--color-primary);
}

.member-badge :deep(svg) {
  width: 16px;
  height: 16px;
}

.member-actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  background: transparent;
  border: none;
  color: var(--text-muted);
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-icon:hover {
  background: var(--bg-hover);
  color: var(--color-primary);
}

.btn-icon :deep(svg) {
  width: 18px;
  height: 18px;
}

/* ========== EMPTY MEMBERS ========== */
.empty-members {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  opacity: 0.3;
}

.empty-icon :deep(svg) {
  width: 64px;
  height: 64px;
}

.empty-members p {
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 0.85rem;
  opacity: 0.7;
}

/* ========== TABS SECTION ========== */
.tabs-section {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.tabs-header-row {
  display: flex;
  border-bottom: 1px solid var(--border-color);
}

.tab-btn {
  flex: 1;
  padding: 14px 20px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
}

.tab-btn:hover {
  color: var(--text-main);
  background: var(--bg-tertiary);
}

.tab-btn.active {
  color: var(--color-primary);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: var(--color-primary);
  border-radius: 2px 2px 0 0;
}

.tab-btn :deep(svg) {
  width: 18px;
  height: 18px;
}

.tab-content-area {
  padding: 24px;
}

/* ========== SUMMARY STATS ========== */
.summary-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  flex-shrink: 0;
}

.stat-icon :deep(svg) {
  width: 24px;
  height: 24px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-main);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* ========== MEMBER STATS GRID ========== */
.member-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.member-stat-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 16px;
}

.msc-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.msc-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  color: white;
  flex-shrink: 0;
}

.msc-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-main);
}

.msc-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.msc-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.msc-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.msc-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-main);
}

.msc-categories {
  display: flex;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  background: var(--bg-tertiary);
}

.msc-cat-bar {
  transition: width 0.3s ease;
}

/* ========== RANKING ========== */
.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  transition: var(--transition-fast);
}

.ranking-item.is-you {
  background: linear-gradient(135deg, rgba(91, 110, 225, 0.08), rgba(139, 92, 246, 0.08));
  border-color: var(--color-primary);
}

.ranking-rank {
  width: 32px;
  text-align: center;
  flex-shrink: 0;
}

.rank-medal {
  font-size: 1.3rem;
}

.rank-number {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-muted);
}

.ranking-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  color: white;
  flex-shrink: 0;
}

.ranking-info {
  flex: 1;
  min-width: 0;
}

.ranking-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 8px;
}

.you-tag {
  font-size: 0.7rem;
  background: var(--color-primary);
  color: white;
  padding: 1px 6px;
  border-radius: 10px;
  font-weight: 600;
}

.ranking-detail {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.ranking-bar-wrap {
  width: 120px;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
}

.ranking-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), #8b5cf6);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.empty-ranking {
  text-align: center;
  padding: 32px;
  color: var(--text-muted);
}

/* ========== HISTORY MODAL ========== */
.history-modal {
  max-width: 600px;
  max-height: 80vh;
}

.stats-modal {
  max-width: 550px;
  max-height: 80vh;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 60vh;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

.history-item:hover {
  background: var(--bg-hover);
}

.history-time {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 500;
  min-width: 60px;
  flex-shrink: 0;
}

.history-content {
  flex: 1;
  min-width: 0;
}

.history-app {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-main);
  margin-bottom: 2px;
}

.history-title {
  font-size: 0.85rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-duration {
  font-size: 0.85rem;
  color: var(--color-primary);
  font-weight: 600;
  flex-shrink: 0;
}

.history-category-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
  color: var(--text-muted);
  flex-shrink: 0;
}

.empty-history {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}

/* ========== STATS MODAL DETAIL ========== */
.stats-overview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.so-item {
  background: var(--bg-tertiary);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.so-label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.so-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-main);
}

.stats-detail h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 12px;
  margin-top: 20px;
}

.stats-detail h4:first-child {
  margin-top: 0;
}

.top-apps-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.top-app-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ta-rank {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  width: 24px;
  flex-shrink: 0;
}

.ta-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-main);
  width: 120px;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ta-bar-wrap {
  flex: 1;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.ta-bar {
  height: 100%;
  background: var(--color-primary);
  border-radius: 3px;
}

.ta-time {
  font-size: 0.8rem;
  color: var(--text-muted);
  width: 60px;
  text-align: right;
  flex-shrink: 0;
}

.category-pie {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cat-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cat-name {
  font-size: 0.85rem;
  color: var(--text-main);
  width: 90px;
  flex-shrink: 0;
}

.cat-bar-wrap {
  flex: 1;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.cat-bar {
  height: 100%;
  border-radius: 3px;
}

.cat-pct {
  font-size: 0.8rem;
  color: var(--text-muted);
  width: 40px;
  text-align: right;
  flex-shrink: 0;
}

/* ========== MODAL BASE (shared) ========== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-content {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  max-width: 90vw;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-main);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-main);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .team-join-card {
    padding: 24px;
  }

  .input-group {
    flex-direction: column;
  }

  .group-header-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .group-actions {
    width: 100%;
  }

  .group-actions .btn {
    flex: 1;
    justify-content: center;
  }

  .summary-stats {
    grid-template-columns: 1fr;
  }

  .member-stats-grid {
    grid-template-columns: 1fr;
  }

  .ranking-bar-wrap {
    display: none;
  }

  .tabs-header-row {
    overflow-x: auto;
  }

  .tab-btn {
    white-space: nowrap;
    padding: 12px 16px;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .page-header h2 {
    font-size: 1.5rem;
  }

  .join-card-header h3 {
    font-size: 1.25rem;
  }

  .group-details h3 {
    font-size: 1.1rem;
  }

  .member-name {
    font-size: 0.9rem;
  }

  .stat-item {
    padding: 12px;
  }

  .stat-value {
    font-size: 1.1rem;
  }
}
</style>
