<template>
  <div class="page page-shell team-page">
    <div class="page-container">
      <div class="page-header">
        <h2>{{ $t('team.title') || 'Team' }}</h2>
        <p class="subtitle">{{ $t('team.subtitle') || 'Collaborate and track team activity' }}</p>
      </div>

      
      <div v-if="!isInGroup" class="team-join-card animate-enter">
        <div class="join-card-header">
          <div class="join-icon" v-html="Icons.team"></div>
          <h3>{{ $t('team.joinOrCreate') || 'Join or Create a Group' }}</h3>
          <p class="join-desc">Connect with your team via P2P and see real-time activity</p>
        </div>

        <div class="join-actions">
          
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

          <div class="join-divider">
            <span>{{ $t('team.or') || 'OR' }}</span>
          </div>

          <div class="join-section">
            <h4>{{ $t('team.uploadReport') || 'Load Offline Report' }}</h4>
            <button class="btn btn-secondary" style="width: 100%; justify-content: center;" @click="triggerFileInput">
              <span v-html="Icons.download"></span>
              {{ $t('team.uploadReport') || 'Upload Report' }}
            </button>
          </div>
        </div>
      </div>

      
      <div v-else class="team-dashboard animate-enter">
        
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
            <button class="btn btn-secondary" @click="triggerFileInput">
              <span v-html="Icons.download"></span>
              {{ $t('team.uploadReport') || 'Upload Report' }}
            </button>
            <div class="export-dropdown-wrapper">
              <button class="btn btn-secondary" @click.stop="toggleExportDropdown" :disabled="members.length === 0">
                <span v-html="Icons.download"></span>
                {{ $t('team.export') || 'Export' }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="showExportDropdown" class="export-dropdown-menu" @click.stop>
                <button class="dropdown-item" @click="triggerExport('json')">
                  <span v-html="Icons.download"></span>
                  {{ $t('team.exportJSON') || 'Export JSON' }}
                </button>
                <button class="dropdown-item" @click="triggerExport('html')">
                  <span v-html="Icons.download"></span>
                  {{ $t('team.exportHTML') || 'Export HTML' }}
                </button>
                <button class="dropdown-item" @click="triggerExport('csv')">
                  <span v-html="Icons.download"></span>
                  {{ $t('team.exportCSV') || 'Export CSV' }}
                </button>
              </div>
            </div>
            <div class="settings-dropdown-wrapper">
              <button class="btn btn-secondary" @click.stop="toggleSettingsDropdown">
                <span v-html="Icons.settings"></span>
                {{ $t('team.settings') || 'Settings' }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="showSettingsDropdown" class="settings-dropdown-menu" @click.stop>
                <div class="settings-menu-header">
                  <h4>{{ $t('team.privacySettings') || 'Privacy Settings' }}</h4>
                </div>
                <div class="settings-menu-item">
                  <div class="settings-item-info">
                    <span class="settings-item-title">{{ $t('team.shareMusicTitle') || 'Share Music' }}</span>
                    <span class="settings-item-desc">{{ $t('team.shareMusicDesc') || 'Show current music in Focus mode' }}</span>
                  </div>
                  <label class="premium-switch">
                    <input type="checkbox" v-model="teamsStore.myProfile.musicSharingEnabled" @change="handleMusicSharingToggle" />
                    <span class="slider round"></span>
                  </label>
                </div>
              </div>
            </div>
            <button class="btn btn-danger" @click="handleLeaveGroup">
              <span v-html="Icons.close"></span>
              {{ $t('team.leave') || 'Leave' }}
            </button>
          </div>
        </div>

        
        <div class="members-section">
          <div class="section-header">
            <h4>{{ $t('team.members') || 'Members' }} ({{ members.length }})</h4>
            <div class="connection-status" :class="{ connected: isConnected }">
              <span class="status-dot"></span>
              {{ isConnected ? ($t('team.connected') || 'Connected') : ($t('team.connecting') || 'Connecting...') }}
            </div>
          </div>

          <div class="members-grid">
            
            <div class="member-card current-user">
              <div class="member-avatar">
                <span class="avatar-letter">{{ currentUserInitial }}</span>
              </div>
              <div class="member-info">
                <div class="member-name">
                  {{ currentUserName }} ({{ $t('team.you') || 'You' }})
                  <span v-if="isLeaderUser" class="leader-badge" v-html="Icons.team"></span>
                  <span v-if="currentUserFocusModeActive" class="badge-focusing animate-glow">
                     {{ $t('team.focusing') || 'Focusing' }}<span v-if="currentUserMember.focusTargetApp" class="focus-app-name">: {{ currentUserMember.focusTargetApp }}</span>
                  </span>
                  <span
                    v-if="currentUserFocusModeActive && currentUserMember.musicSharingEnabled && currentUserMember.currentMusicTitle"
                    class="badge-music-container"
                  >
                    <span
                      class="badge-music animate-pulse-slow cursor-pointer"
                      @click.stop="toggleMusicPopover(currentUserMember.id)"
                      title="Show current music"
                    >
                      
                    </span>
                    <div
                      v-if="activeMusicPopoverId === currentUserMember.id"
                      class="music-popover-tooltip animate-scale-in"
                      @click.stop
                    >
                      <div class="popover-header">
                        <span class="pulse-note"></span> Now Listening
                      </div>
                      <div class="popover-track-info">
                        <div class="popover-title">{{ currentUserMember.currentMusicTitle }}</div>
                        <div class="popover-artist">{{ currentUserMember.currentMusicArtist || 'Unknown Artist' }}</div>
                      </div>
                    </div>
                  </span>
                  <span v-if="currentUserInTimeout" class="badge-break animate-pulse-slow">
                     {{ $t('team.onBreak') || 'On Break' }}
                  </span>
                </div>
                <div class="member-status">
                  <span class="status-indicator online"></span>
                  {{ currentApp || ($t('team.noActivity') || 'No activity') }}
                </div>
                <div class="member-time">{{ currentTimeSpent }}</div>

                <div v-if="currentUserUniqueApps.length > 0" class="member-app-history">
                  <span v-for="app in currentUserUniqueApps" :key="app.name" class="app-history-tag">
                    {{ app.name }} ({{ app.duration }})
                  </span>
                </div>

                <div class="member-tasks-container">
                  <div class="tasks-header">
                    <span>{{ $t('team.tasksTitle') || 'Tasks Checklist' }}</span>
                  </div>
                  <div v-if="currentUserTasks && currentUserTasks.length > 0" class="tasks-list-mini">
                    <div v-for="(task, idx) in currentUserTasks" :key="idx" class="task-item-mini">
                      <span class="task-dot-bullet">•</span>
                      <span class="task-text-mini">{{ task }}</span>
                      <button v-if="isLeaderUser" class="btn-task-delete" @click="handleDeleteTask(currentUserMember.id, idx)">
                        &times;
                      </button>
                    </div>
                  </div>
                  <div v-if="isLeaderUser" class="add-task-row-mini">
                    <input
                      v-model="newTasksMap[currentUserMember.id]"
                      type="text"
                      :placeholder="$t('team.taskPlaceholder') || 'Add task...'"
                      class="task-input-mini"
                      @keyup.enter="handleAddTask(currentUserMember.id)"
                    />
                    <button class="btn-task-add" @click="handleAddTask(currentUserMember.id)">
                      <span v-html="Icons.plus"></span>
                    </button>
                  </div>
                </div>
              </div>
              <div class="member-badge current" v-html="Icons.check"></div>
            </div>

            
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
                  <span v-if="editingMemberId !== member.id">{{ member.name }}</span>
                  <input
                    v-else
                    v-model="editMemberName"
                    type="text"
                    class="edit-name-input"
                    @keyup.enter="saveMemberRename(member.id)"
                    @blur="saveMemberRename(member.id)"
                    ref="renameInput"
                  />
                  <span v-if="member.isLeader" class="leader-badge" v-html="Icons.team"></span>
                  <span v-if="member.focusModeActive" class="badge-focusing animate-glow">
                     {{ $t('team.focusing') || 'Focusing' }}<span v-if="member.focusTargetApp" class="focus-app-name">: {{ member.focusTargetApp }}</span>
                  </span>
                  <span
                    v-if="member.focusModeActive && member.musicSharingEnabled && member.currentMusicTitle"
                    class="badge-music-container"
                  >
                    <span
                      class="badge-music animate-pulse-slow cursor-pointer"
                      @click.stop="toggleMusicPopover(member.id)"
                      title="Show current music"
                    >
                      
                    </span>
                    <div
                      v-if="activeMusicPopoverId === member.id"
                      class="music-popover-tooltip animate-scale-in"
                      @click.stop
                    >
                      <div class="popover-header">
                        <span class="pulse-note"></span> Now Listening
                      </div>
                      <div class="popover-track-info">
                        <div class="popover-title">{{ member.currentMusicTitle }}</div>
                        <div class="popover-artist">{{ member.currentMusicArtist || 'Unknown Artist' }}</div>
                      </div>
                    </div>
                  </span>
                  <span v-if="member.inTimeout" class="badge-break animate-pulse-slow">
                     {{ $t('team.onBreak') || 'On Break' }}
                  </span>
                </div>
                <div class="member-status">
                  <span class="status-indicator" :class="member.status === 'offline' ? 'offline' : 'online'"></span>
                  {{ member.currentApp || ($t('team.noActivity') || 'No activity') }}
                </div>
                <div class="member-time">{{ formatDuration(member.totalOnlineSeconds) }}</div>

                <div v-if="getUniqueApps(member).length > 0" class="member-app-history">
                  <span v-for="app in getUniqueApps(member)" :key="app.name" class="app-history-tag">
                    {{ app.name }} ({{ app.duration }})
                  </span>
                </div>

                <div class="member-tasks-container">
                  <div class="tasks-header">
                    <span>{{ $t('team.tasksTitle') || 'Tasks Checklist' }}</span>
                  </div>
                  <div v-if="member.tasks && member.tasks.length > 0" class="tasks-list-mini">
                    <div v-for="(task, idx) in member.tasks" :key="idx" class="task-item-mini">
                      <span class="task-dot-bullet">•</span>
                      <span class="task-text-mini">{{ task }}</span>
                      <button v-if="isLeaderUser" class="btn-task-delete" @click="handleDeleteTask(member.id, idx)">
                        &times;
                      </button>
                    </div>
                  </div>
                  <div v-if="isLeaderUser" class="add-task-row-mini">
                    <input
                      v-model="newTasksMap[member.id]"
                      type="text"
                      :placeholder="$t('team.taskPlaceholder') || 'Add task...'"
                      class="task-input-mini"
                      @keyup.enter="handleAddTask(member.id)"
                    />
                    <button class="btn-task-add" @click="handleAddTask(member.id)">
                      <span v-html="Icons.plus"></span>
                    </button>
                  </div>
                </div>
              </div>
              <div class="member-actions">
                <button v-if="isLeaderUser" class="btn-icon" @click="startRename(member)" :title="$t('team.rename') || 'Rename'">
                  <span v-html="Icons.edit"></span>
                </button>
                <button v-if="isLeaderUser" class="btn-icon text-danger" @click="handleKickMember(member)" :title="$t('team.kick') || 'Kick'">
                  <span v-html="Icons.trash"></span>
                </button>
                <button class="btn-icon" @click="handleDownloadMemberReport(member)" :title="$t('team.downloadReport') || 'Download Report'">
                  <span v-html="Icons.download"></span>
                </button>
                <button class="btn-icon" @click="viewMemberHistory(member)" :title="$t('team.viewHistory') || 'View History'">
                  <span v-html="Icons.timeline"></span>
                </button>
              </div>
            </div>

            
            <div v-if="otherMembers.length === 0" class="empty-members">
              <div class="empty-icon" v-html="Icons.team"></div>
              <p>{{ $t('team.noMembers') || 'No other members yet' }}</p>
              <p class="empty-hint">{{ $t('team.shareCode') || 'Share the group code to invite others' }}</p>
            </div>
          </div>
        </div>

        
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

          
          <div v-if="activeTab === 'stats'" class="tab-content-area">
            
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

          
          <div v-if="activeTab === 'ranking'" class="tab-content-area">
            <div class="ranking-list">
              <div
                v-for="entry in onlineRanking"
                :key="entry.memberId"
                class="ranking-item"
                :class="{ 'is-you': entry.memberId === myProfile.id }"
              >
                <div class="ranking-rank">
                  <span v-if="entry.rank === 1" class="rank-medal gold">1</span>
                  <span v-else-if="entry.rank === 2" class="rank-medal silver">2</span>
                  <span v-else-if="entry.rank === 3" class="rank-medal bronze">3</span>
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
    <input ref="fileInput" type="file" accept=".json,.html,.csv" @change="handleFileUpload" style="display:none" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Icons } from '../components/icons/IconMap';
import { useTeamsStore } from '../stores/teams';
import { getConfirmDialog } from '../composables/useConfirmDialog';
import { useTeamNotification } from '../composables/useTeamNotification';

const teamsStore = useTeamsStore();
const { reportDownloaded: notifyReportDownloaded } = useTeamNotification();
const { t } = useI18n();

const isInGroup = computed(() => teamsStore.isInGroup);
const groupName = computed(() => teamsStore.groupName);
const groupCode = computed(() => teamsStore.groupCode);
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

const fileInput = ref<HTMLInputElement | null>(null);
const showExportDropdown = ref(false);
const showSettingsDropdown = ref(false);
const activeMusicPopoverId = ref<string | null>(null);

function toggleExportDropdown() {
  showExportDropdown.value = !showExportDropdown.value;
}

function toggleSettingsDropdown() {
  showSettingsDropdown.value = !showSettingsDropdown.value;
}

function handleMusicSharingToggle() {
  localStorage.setItem("timigs_team_share_music", String(teamsStore.myProfile.musicSharingEnabled));
  teamsStore.pollCurrentActivity();
}

function toggleMusicPopover(memberId: string) {
  if (activeMusicPopoverId.value === memberId) {
    activeMusicPopoverId.value = null;
  } else {
    activeMusicPopoverId.value = memberId;
  }
}

function handleCloseDropdown() {
  showExportDropdown.value = false;
  showSettingsDropdown.value = false;
  activeMusicPopoverId.value = null;
}

function triggerExport(format: 'json' | 'html' | 'csv') {
  showExportDropdown.value = false;
  if (format === 'json') {
    handleDownloadGroupReport();
  } else if (format === 'html') {
    handleExportHTMLReport();
  } else if (format === 'csv') {
    handleExportCSVReport();
  }
}
const editingMemberId = ref<string | null>(null);
const editMemberName = ref('');
const newTasksMap = ref<Record<string, string>>({});

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

const isLeaderUser = computed(() => teamsStore.isLeader);

const currentUserMember = computed(() => {
  return members.value.find(m => m.id === myProfile.value.id) || {
    id: myProfile.value.id,
    name: myProfile.value.name,
    activityHistory: [],
    totalOnlineSeconds: 0,
    tasks: [],
    inTimeout: false,
    focusModeActive: false,
    focusTargetApp: "",
    currentMusicTitle: "",
    currentMusicArtist: "",
    musicSharingEnabled: teamsStore.myProfile.musicSharingEnabled
  };
});

const currentUserUniqueApps = computed(() => getUniqueApps(currentUserMember.value));
const currentUserTasks = computed(() => currentUserMember.value.tasks || []);
const currentUserFocusModeActive = computed(() => !!currentUserMember.value.focusModeActive);
const currentUserInTimeout = computed(() => !!currentUserMember.value.inTimeout);



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



async function handleCreateGroup() {
  if (!newGroupName.value.trim()) return;
  creating.value = true;
  try {
    await teamsStore.createGroup(newGroupName.value);
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
    if (!success) {
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
  }
}

function copyGroupCode() {
  navigator.clipboard.writeText(groupCode.value);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}

async function triggerFileInput() {
  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const { readTextFile } = await import("@tauri-apps/plugin-fs");

    const selected = await open({
      multiple: false,
      filters: [{ name: 'Group Report', extensions: ['json', 'html', 'csv'] }]
    });

    if (selected && typeof selected === 'string') {
      const content = await readTextFile(selected);
      const extension = selected.split('.').pop()?.toLowerCase() || '';
      processReportContent(content, extension);
    }
  } catch (err) {
    console.error("Failed to select or read file via Tauri native dialog, falling back to HTML input:", err);
    if (fileInput.value) {
      fileInput.value.click();
    }
  }
}

function processReportContent(content: string, extension: string) {
  try {
    let report: any = null;

    if (extension === 'json') {
      report = JSON.parse(content);
    } else if (extension === 'html') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const scriptTag = doc.getElementById('raw-report-data');
      if (scriptTag && scriptTag.textContent) {
        report = JSON.parse(scriptTag.textContent.trim());
      } else {
        alert('Could not find raw report data inside the HTML file.');
        return;
      }
    } else if (extension === 'csv') {
      report = parseCSVReport(content);
    } else {
      alert('Unsupported file format. Please upload a .json, .html, or .csv file.');
      return;
    }

    if (report && report.groupCode && report.members) {
      teamsStore.loadReportData(report);
    } else {
      alert('Invalid report format. Please select a valid group report file.');
    }
  } catch (err) {
    console.error(err);
    alert('Failed to parse report file. Please make sure the file is valid.');
  }
}

function parseCSVReport(csvContent: string): any {
  const lines: string[] = [];
  let currentLine = "";
  let insideQuotes = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentLine += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === '\n' && !insideQuotes) {
      lines.push(currentLine);
      currentLine = "";
    } else if (char === '\r' && !insideQuotes) {
    } else {
      currentLine += char;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length < 2) {
    throw new Error("Invalid CSV format: Too few rows");
  }

  const parseCSVRow = (line: string): string[] => {
    const result: string[] = [];
    let currentField = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(currentField);
        currentField = "";
      } else {
        currentField += char;
      }
    }
    result.push(currentField);
    return result;
  };

  const members: any[] = [];
  let gName = "";
  let gCode = "";
  let leaderId = "";
  let createdAt = Date.now();
  let generatedAt = Date.now();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVRow(lines[i]);
    if (values.length < 14) continue;

    gName = values[0];
    gCode = values[1];
    leaderId = values[2];
    createdAt = parseInt(values[3]) || Date.now();
    generatedAt = parseInt(values[4]) || Date.now();

    try {
      const member: any = {
        memberId: values[5],
        memberName: values[6],
        isLeader: values[7] === "true",
        totalOnlineSeconds: parseInt(values[8]) || 0,
        activityHistory: JSON.parse(values[9] || "[]"),
        stats: JSON.parse(values[10] || "{}"),
        tasks: JSON.parse(values[11] || "[]"),
        inTimeout: values[12] === "true",
        focusModeActive: values[13] === "true"
      };
      members.push(member);
    } catch (e) {
      console.error(e);
    }
  }

  return {
    groupName: gName,
    groupCode: gCode,
    leaderId,
    createdAt,
    generatedAt,
    members
  };
}

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    processReportContent(content, extension);
  };
  reader.readAsText(file);
}

function startRename(member: any) {
  editingMemberId.value = member.id;
  editMemberName.value = member.name;
}

function saveMemberRename(memberId: string) {
  if (editMemberName.value && editMemberName.value.trim()) {
    teamsStore.renameMember(memberId, editMemberName.value.trim());
  }
  editingMemberId.value = null;
}

function handleAddTask(memberId: string) {
  const text = newTasksMap.value[memberId];
  if (text && text.trim()) {
    teamsStore.addMemberTask(memberId, text.trim());
    newTasksMap.value[memberId] = '';
  }
}

function handleDeleteTask(memberId: string, index: number) {
  teamsStore.removeMemberTask(memberId, index);
}

async function handleKickMember(member: any) {
  const confirmed = await getConfirmDialog().confirm({
    title: 'Kick Member?',
    message: `Are you sure you want to kick ${member.name} from the group?`,
    confirmText: 'Kick',
    cancelText: 'Cancel',
    type: 'warning'
  });
  if (confirmed) {
    teamsStore.kickMember(member.id);
  }
}

function getUniqueApps(member: any) {
  if (!member || !member.activityHistory) return [];
  const appDurations = new Map<string, number>();
  member.activityHistory.forEach((entry: any) => {
    if (entry.appName) {
      appDurations.set(entry.appName, (appDurations.get(entry.appName) || 0) + (entry.durationSeconds || 0));
    }
  });
  return Array.from(appDurations.entries())
    .map(([name, seconds]) => ({
      name,
      duration: formatDuration(seconds),
      seconds
    }))
    .sort((a, b) => b.seconds - a.seconds);
}



function handleDownloadGroupReport() {
  const report = teamsStore.generateGroupReport();
  teamsStore.downloadReport(report);
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
  return colors[Math.abs(hash) % colors.length];
}

function generateHTMLTemplate(report: any): string {
  const formatSecs = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const membersHtml = report.members.map((member: any) => {
    const avatarLetter = member.memberName.charAt(0).toUpperCase();
    const avatarBg = getAvatarColor(member.memberName);
    const roleBadge = member.isLeader ? `<span class="leader-badge">Leader</span>` : `<span class="member-badge">Member</span>`;
    
    let statusBadge = '';
    if (member.focusModeActive) {
      statusBadge = `<span class="status-badge focusing"> Focusing</span>`;
    } else if (member.inTimeout) {
      statusBadge = `<span class="status-badge on-break"> On Break</span>`;
    } else {
      statusBadge = `<span class="status-badge online">● Online</span>`;
    }
    
    const totalTime = formatSecs(member.totalOnlineSeconds);
    const topApp = member.stats?.topApps?.[0]?.appName || '—';
    
    const tasksList = member.tasks && member.tasks.length > 0
      ? `<ul class="task-list">${member.tasks.map((t: string) => `<li>${t}</li>`).join('')}</ul>`
      : `<span class="text-muted">—</span>`;
      
    return `
      <tr>
        <td>
          <div class="member-cell">
            <div class="avatar" style="background: ${avatarBg}">${avatarLetter}</div>
            <div>
              <div class="name-row">
                <span class="member-name">${member.memberName}</span>
                ${roleBadge}
              </div>
            </div>
          </div>
        </td>
        <td>${statusBadge}</td>
        <td>${totalTime}</td>
        <td><span class="app-badge">${topApp}</span></td>
        <td>${tasksList}</td>
      </tr>
    `;
  }).join('');

  const detailsHtml = report.members.map((member: any) => {
    const avatarLetter = member.memberName.charAt(0).toUpperCase();
    const avatarBg = getAvatarColor(member.memberName);
    
    const topAppsHtml = member.stats?.topApps && member.stats.topApps.length > 0
      ? member.stats.topApps.map((app: any) => {
          const duration = formatSecs(app.totalSeconds);
          return `
            <div class="app-bar-container">
              <div class="app-bar-header">
                <span class="app-name">${app.appName}</span>
                <span class="duration">${duration} (${app.percentage}%)</span>
              </div>
              <div class="bar-bg">
                <div class="bar-fill" style="width: ${app.percentage}%"></div>
              </div>
            </div>
          `;
        }).join('')
      : `<div class="no-data">No applications recorded</div>`;
      
    const categoryHtml = member.stats?.categoryBreakdown && member.stats.categoryBreakdown.length > 0
      ? member.stats.categoryBreakdown.map((cat: any) => {
          const duration = formatSecs(cat.totalSeconds);
          return `
            <div class="app-bar-container">
              <div class="app-bar-header">
                <span class="app-name">${cat.category}</span>
                <span class="duration">${duration} (${cat.percentage}%)</span>
              </div>
              <div class="bar-bg">
                <div class="bar-fill" style="width: ${cat.percentage}%; background-color: ${cat.color || '#6366f1'}"></div>
              </div>
            </div>
          `;
        }).join('')
      : `<div class="no-data">No category data</div>`;

    return `
      <div class="member-detail-card">
        <div class="detail-header">
          <div class="detail-header-left">
            <div class="avatar" style="background: ${avatarBg}">${avatarLetter}</div>
            <span class="name">${member.memberName}</span>
          </div>
          <span class="online-time">${formatSecs(member.totalOnlineSeconds)}</span>
        </div>
        
        <div class="detail-section-title">Applications Usage</div>
        <div class="app-bars-list">
          ${topAppsHtml}
        </div>
        
        <div class="detail-section-title" style="margin-top: 25px;">Category Breakdown</div>
        <div class="app-bars-list">
          ${categoryHtml}
        </div>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TimiGS Team Report - ${report.groupName || 'Team'}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #0b0f19;
      --card-bg: rgba(17, 24, 39, 0.7);
      --card-border: rgba(255, 255, 255, 0.08);
      --text-color: #f3f4f6;
      --text-muted: #9ca3af;
      --accent-color: #6366f1;
      --success-color: #10b981;
      --warning-color: #f59e0b;
      --danger-color: #ef4444;
    }
    
    body {
      background-color: var(--bg-color);
      color: var(--text-color);
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 40px 20px;
      line-height: 1.5;
    }

    .container {
      max-width: 1100px;
      margin: 0 auto;
    }

    header {
      text-align: center;
      margin-bottom: 40px;
      padding: 30px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      backdrop-filter: blur(10px);
    }

    h1 {
      margin: 0 0 10px 0;
      font-size: 2.5rem;
      font-weight: 700;
      background: var(--bg-tertiary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .meta {
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    .group-code-badge {
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: #a5b4fc;
      padding: 3px 8px;
      border-radius: 6px;
      font-family: monospace;
      font-weight: 600;
      font-size: 1rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 45px;
    }

    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      backdrop-filter: blur(10px);
    }

    .stat-card .value {
      font-size: 1.8rem;
      font-weight: 700;
      margin: 5px 0 0 0;
      color: var(--accent-color);
    }

    .stat-card .label {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 40px 0 20px 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      overflow: hidden;
      backdrop-filter: blur(10px);
      margin-bottom: 40px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    th {
      background: rgba(255, 255, 255, 0.03);
      padding: 16px 20px;
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--text-muted);
      border-bottom: 1px solid var(--card-border);
    }

    td {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      vertical-align: middle;
      font-size: 0.95rem;
    }

    tr:last-child td {
      border-bottom: none;
    }

    .member-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: #fff;
      font-size: 0.95rem;
      text-transform: uppercase;
    }

    .name-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .member-name {
      font-weight: 600;
    }

    .leader-badge {
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: #a5b4fc;
      font-size: 0.75rem;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
    }

    .member-badge {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: var(--text-muted);
      font-size: 0.75rem;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.8rem;
      padding: 4px 8px;
      border-radius: 6px;
      font-weight: 500;
    }

    .status-badge.focusing {
      background: rgba(99, 102, 241, 0.15);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }

    .status-badge.on-break {
      background: rgba(245, 158, 11, 0.15);
      color: #fde047;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .status-badge.online {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .app-badge {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.85rem;
    }

    .task-list {
      margin: 0;
      padding-left: 18px;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .task-list li {
      margin-bottom: 4px;
    }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 30px;
    }

    @media (min-width: 768px) {
      .details-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .member-detail-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 24px;
      backdrop-filter: blur(10px);
    }

    .detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 15px;
      margin-bottom: 20px;
    }

    .detail-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .detail-header .name {
      font-size: 1.2rem;
      font-weight: 600;
    }

    .online-time {
      font-weight: 600;
      color: var(--accent-color);
    }

    .detail-section-title {
      font-size: 0.95rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 15px;
    }

    .app-bar-container {
      margin-bottom: 15px;
    }

    .app-bar-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      margin-bottom: 6px;
    }

    .app-bar-header .app-name {
      font-weight: 500;
    }

    .app-bar-header .duration {
      color: var(--text-muted);
    }

    .bar-bg {
      height: 8px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background: var(--accent-color);
      border-radius: 4px;
    }

    .no-data {
      color: var(--text-muted);
      text-align: center;
      padding: 20px;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${report.groupName || 'Team'} Activity Report</h1>
      <div class="meta">
        Group Code: <span class="group-code-badge">${report.groupCode || '—'}</span>
        &nbsp;&bull;&nbsp;
        Generated: <span>${new Date(report.generatedAt).toLocaleString()}</span>
      </div>
    </header>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">Total Members</div>
        <div class="value">${report.members.length}</div>
      </div>
      <div class="stat-card">
        <div class="label">Total Team Time</div>
        <div class="value">${formatSecs(report.members.reduce((acc: number, m: any) => acc + m.totalOnlineSeconds, 0))}</div>
      </div>
    </div>

    <div class="section-title">Members Activity Summary</div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Member</th>
            <th>Status</th>
            <th>Total Time</th>
            <th>Top Program</th>
            <th>Tasks Checklist</th>
          </tr>
        </thead>
        <tbody>
          ${membersHtml}
        </tbody>
      </table>
    </div>

    <div class="section-title">Detailed Applications & Categories</div>
    <div class="details-grid">
      ${detailsHtml}
    </div>
  </div>
  <script id="raw-report-data" type="application/json">${JSON.stringify(report)}${'</' + 'script>'}
</body>
</html>
  `;
}

async function handleExportHTMLReport() {
  const report = teamsStore.generateGroupReport();
  const htmlContent = generateHTMLTemplate(report);

  try {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeTextFile } = await import("@tauri-apps/plugin-fs");
    
    const finalName = `${report.groupName || 'Team'}_Report_${new Date().toISOString().split('T')[0]}.html`;
    const savePath = await save({
      defaultPath: finalName,
      filters: [{ name: 'HTML Document', extensions: ['html'] }]
    });

    if (savePath) {
      await writeTextFile(savePath, htmlContent);
    }
  } catch (e) {
    console.error("Failed to download HTML report via Tauri:", e);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.groupName || 'Team'}_Report_${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

function generateCSVReport(report: any): string {
  const headers = [
    "groupName",
    "groupCode",
    "leaderId",
    "createdAt",
    "generatedAt",
    "memberId",
    "memberName",
    "isLeader",
    "totalOnlineSeconds",
    "activityHistoryJson",
    "statsJson",
    "tasksJson",
    "inTimeout",
    "focusModeActive"
  ];
  
  const escapeCSVValue = (val: any) => {
    if (val === null || val === undefined) return "";
    let str = typeof val === "string" ? val : JSON.stringify(val);
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = [headers.join(",")];

  for (const m of report.members) {
    const row = [
      escapeCSVValue(report.groupName),
      escapeCSVValue(report.groupCode),
      escapeCSVValue(report.leaderId),
      escapeCSVValue(report.createdAt),
      escapeCSVValue(report.generatedAt),
      escapeCSVValue(m.memberId),
      escapeCSVValue(m.memberName),
      escapeCSVValue(m.isLeader),
      escapeCSVValue(m.totalOnlineSeconds),
      escapeCSVValue(m.activityHistory),
      escapeCSVValue(m.stats),
      escapeCSVValue(m.tasks || []),
      escapeCSVValue(!!m.inTimeout),
      escapeCSVValue(!!m.focusModeActive)
    ];
    rows.push(row.join(","));
  }

  return rows.join("\n");
}

async function handleExportCSVReport() {
  const report = teamsStore.generateGroupReport();
  const csvContent = generateCSVReport(report);

  try {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeTextFile } = await import("@tauri-apps/plugin-fs");
    
    const finalName = `${report.groupName || 'Team'}_Report_${new Date().toISOString().split('T')[0]}.csv`;
    const savePath = await save({
      defaultPath: finalName,
      filters: [{ name: 'CSV Document', extensions: ['csv'] }]
    });

    if (savePath) {
      await writeTextFile(savePath, csvContent);
    }
  } catch (e) {
    console.error("Failed to download CSV report via Tauri:", e);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.groupName || 'Team'}_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

async function handleDownloadMemberReport(member: any) {
  const report = teamsStore.generateMemberReport(member.id);
  if (!report) return;


  teamsStore.notifyReportDownloaded(member.id);
  notifyReportDownloaded(myProfile.value.name || 'Someone');

  teamsStore.downloadReport(report);
}



function viewMemberHistory(member: any) {
  selectedMember.value = member;
  selectedMemberHistory.value = [...member.activityHistory].reverse();
  showHistoryModal.value = true;
}

onMounted(async () => {
  window.addEventListener('click', handleCloseDropdown);
  await teamsStore.ensureProfile();
  if (localStorage.getItem('timigs_disconnected_on_restart') === 'true') {
    localStorage.removeItem('timigs_disconnected_on_restart');
    await getConfirmDialog().confirm({
      title: t('team.disconnectedOnRestartTitle') || 'Disconnected',
      message: t('team.disconnectedOnRestartMessage') || 'You have been disconnected from the group because the application was restarted. Please ask for the code again or try to join the room again.',
      confirmText: 'OK',
      showCancel: false,
      type: 'warning'
    });
  }
});

onUnmounted(() => {
  window.removeEventListener('click', handleCloseDropdown);
});
</script>

<style scoped>

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
  background: var(--bg-tertiary), #8b5cf6);
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
  background: var(--bg-tertiary), #8b5cf6);
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

.export-dropdown-wrapper {
  position: relative;
  display: inline-block;
}

.export-dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(12px);
  z-index: 100;
  display: flex;
  flex-direction: column;
  padding: 6px;
  min-width: 160px;
  gap: 4px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: transparent;
  color: var(--text-main);
  font-size: 0.9rem;
  text-align: left;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background: var(--bg-card-hover);
  color: var(--color-primary);
}

.dropdown-arrow {
  font-size: 0.7rem;
  margin-left: 4px;
  transition: transform 0.2s ease;
  opacity: 0.7;
}


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
  background: var(--bg-tertiary), rgba(139, 92, 246, 0.08));
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
  background: var(--bg-tertiary), rgba(139, 92, 246, 0.08));
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
  background: var(--bg-tertiary), #8b5cf6);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.empty-ranking {
  text-align: center;
  padding: 32px;
  color: var(--text-muted);
}


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

.edit-name-input {
  background: var(--bg-tertiary);
  border: 1px solid var(--color-primary);
  color: var(--text-primary);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  outline: none;
}
.badge-focusing {
  font-size: 0.75rem;
  background: rgba(139, 92, 246, 0.2);
  color: #c084fc;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid rgba(139, 92, 246, 0.4);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
}
.badge-break {
  font-size: 0.75rem;
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid rgba(245, 158, 11, 0.4);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
}
.member-app-history {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.app-history-tag {
  font-size: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}
.member-tasks-container {
  margin-top: 12px;
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 10px;
}
.tasks-header {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
}
.tasks-list-mini {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.task-item-mini {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
}
.task-dot-bullet {
  color: var(--color-primary);
}
.task-text-mini {
  flex: 1;
  color: var(--text-primary);
}
.btn-task-delete {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0 4px;
  transition: var(--transition-fast);
}
.btn-task-delete:hover {
  color: var(--color-danger);
}
.add-task-row-mini {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}
.task-input-mini {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  flex: 1;
  outline: none;
}
.task-input-mini:focus {
  border-color: var(--color-primary);
}
.btn-task-add {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--color-primary);
  padding: 4px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-fast);
}
.btn-task-add:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}
.btn-task-add :deep(svg) {
  width: 14px;
  height: 14px;
}
.animate-glow {
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.3);
}
.animate-pulse-slow {
  animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}


.focus-app-name {
  color: #a78bfa;
  margin-left: 2px;
  font-weight: 700;
}

.badge-music-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-left: 6px;
  vertical-align: middle;
}

.badge-music {
  font-size: 0.85rem;
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid rgba(16, 185, 129, 0.4);
  padding: 2px 6px;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-in-out;
}

.badge-music:hover {
  background: rgba(16, 185, 129, 0.35);
  transform: scale(1.1);
}

.music-popover-tooltip {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 12px;
  width: 240px;
  z-index: 1000;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
  color: white;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.music-popover-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 6px;
  border-style: solid;
  border-color: rgba(15, 23, 42, 0.95) transparent transparent transparent;
}

.popover-header {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 6px;
}

.pulse-note {
  display: inline-block;
  animation: pulse 1.5s infinite;
}

.popover-track-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.popover-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.popover-artist {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


.settings-dropdown-wrapper {
  position: relative;
  display: inline-block;
}

.settings-dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(16px);
  z-index: 100;
  display: flex;
  flex-direction: column;
  padding: 16px;
  min-width: 280px;
  gap: 12px;
}

.settings-menu-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-main);
}

.settings-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.settings-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.settings-item-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-main);
}

.settings-item-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
}


.premium-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.premium-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.1);
  transition: .3s;
  border: 1px solid var(--border-color);
}

.slider::before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
}

input:checked + .slider {
  background-color: #8b5cf6;
}

input:checked + .slider::before {
  transform: translateX(20px);
}

.slider.round {
  border-radius: 24px;
}

.slider.round::before {
  border-radius: 50%;
}

.animate-scale-in {
  animation: scaleIn 0.15s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: translateX(-50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
}
</style>
