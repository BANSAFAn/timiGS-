<template>
  <div class="coding-tracker-section" v-if="totalCodingTime > 0 || (props.isToday && store.currentCodingSession)">
    <div class="section-header">
      <h3>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:middle;margin-right:8px;">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
        {{ t('coding.title') }}
      </h3>
      <div class="header-badges">
        <span class="header-badge active-lang-badge" v-if="mostActiveLanguage">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256" fill="currentColor" style="display:inline;vertical-align:middle;margin-right:4px;">
            <path d="M240,96a15.89,15.89,0,0,0-20.17-15.11l-34,11.33L149.2,36a16,16,0,0,0-30.4,0L82.16,92.22l-34-11.33a16,16,0,0,0-20.3,20.3l24,72A16,16,0,0,0,67.35,184H188.65a16,16,0,0,0,15.52-10.81l24-72A15.9,15.9,0,0,0,240,96ZM188.65,168H67.35l-21.33-64,36.56,12.19a16,16,0,0,0,19.38-9.45L128,45.25l26,59.54a16,16,0,0,0,19.38,9.45l36.56-12.19ZM200,208a8,8,0,0,1-8,8H64a8,8,0,0,1,0-16H192A8,8,0,0,1,200,208Z"/>
          </svg>
          {{ t('coding.most_active_lang') }}: {{ mostActiveLanguage.language === 'Unknown' ? t('coding.unknownCoding') : mostActiveLanguage.language }} ({{ mostActiveLanguage.pct }}%)
        </span>
        <span class="header-badge coding-badge">{{ formatDuration(totalCodingTime) }}</span>
        <span class="header-badge ai-badge" v-if="totalAiCodingTime > 0">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256" fill="currentColor" style="display:inline;vertical-align:middle;margin-right:4px;">
            <path d="M200,112a8,8,0,0,1-8,8H152a8,8,0,0,1,0-16h40A8,8,0,0,1,200,112Zm-8,24H152a8,8,0,0,0,0,16h40a8,8,0,0,0,0-16Zm-32,32H152a8,8,0,0,0,0,16h8a8,8,0,0,0,0-16ZM96,208H72a8,8,0,0,1-8-8V160a8,8,0,0,1,16,0v32H96a8,8,0,0,1,0,16Zm0-96H80V80a8,8,0,0,0-16,0v40a8,8,0,0,0,8,8H96a8,8,0,0,0,0-16ZM232,56V200a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56Zm-16,0H40V200H216V56Z"/>
          </svg>
          {{ aiCodingPercent }}% {{ t('coding.ai', 'AI') }}
        </span>
      </div>
    </div>

    <div class="now-coding" v-if="props.isToday && store.currentCodingSession">
      <div class="now-coding-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>{{ t('coding.now_coding') }}</span>
        <span class="live-badge">
          <span class="live-dot"></span>{{ t('analytics.live', 'LIVE') }}
        </span>
      </div>
      <div class="now-coding-content">
        <div class="coding-editor-badge" :class="getEditorClass(store.currentCodingSession.editor_name)">
          {{ store.currentCodingSession.editor_name }}
        </div>
        <div class="coding-file-info">
          <div class="coding-file" v-if="store.currentCodingSession.file_path">
            <span class="lang-dot" :style="{ background: getLangColor(store.currentCodingSession.language) }"></span>
            <span class="file-name">{{ store.currentCodingSession.file_path === 'Workspace / General' ? t('coding.workspaceGeneral') : store.currentCodingSession.file_path }}</span>
            <span class="lang-tag" v-if="store.currentCodingSession.language">
              {{ store.currentCodingSession.language === 'Unknown' ? t('coding.unknownCoding') : store.currentCodingSession.language }}
            </span>
          </div>
          <div class="coding-project" v-if="store.currentCodingSession.project_dir">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256" fill="currentColor" style="display:inline;vertical-align:middle;margin-right:4px;">
              <path d="M216,72H131.31L104,44.69A15.86,15.86,0,0,0,92.69,40H40A16,16,0,0,0,24,56V200.62A15.4,15.4,0,0,0,39.38,216H216.89A15.13,15.13,0,0,0,232,200.89V88A16,16,0,0,0,216,72ZM40,56H92.69l16,16H40ZM216,200H40V88H216Z"/>
            </svg>
            {{ store.currentCodingSession.project_dir === 'No Project' ? t('coding.noProject') : store.currentCodingSession.project_dir }}
          </div>
        </div>
        <div class="ai-indicator" v-if="store.currentCodingSession.is_ai_assisted">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256" fill="currentColor" style="display:inline;vertical-align:middle;margin-right:4px;">
            <path d="M200,112a8,8,0,0,1-8,8H152a8,8,0,0,1,0-16h40A8,8,0,0,1,200,112Zm-8,24H152a8,8,0,0,0,0,16h40a8,8,0,0,0,0-16Zm-32,32H152a8,8,0,0,0,0,16h8a8,8,0,0,0,0-16ZM96,208H72a8,8,0,0,1-8-8V160a8,8,0,0,1,16,0v32H96a8,8,0,0,1,0,16Zm0-96H80V80a8,8,0,0,0-16,0v40a8,8,0,0,0,8,8H96a8,8,0,0,0,0-16ZM232,56V200a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56Zm-16,0H40V200H216V56Z"/>
          </svg>
          {{ t('coding.ai_assisted') }}
        </div>
      </div>
    </div>

    <div class="coding-split-card" v-if="totalCodingTime > 0">
      <div class="split-row">
        <div class="split-item manual">
          <div class="split-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
              <path d="M223.51,48h-191A16.51,16.51,0,0,0,16,64.49v111A16.51,16.51,0,0,0,32.49,192h72.28l-8.21,24.62A8,8,0,0,0,104.15,224h47.7a8,8,0,0,0,7.59-10.38L151.23,192h72.28A16.51,16.51,0,0,0,240,175.51v-111A16.51,16.51,0,0,0,223.51,48ZM224,175.51a.49.49,0,0,1-.49.49H32.49a.49.49,0,0,1-.49-.49v-111a.49.49,0,0,1,.49-.49h191a.49.49,0,0,1,.49.49ZM72,112a8,8,0,0,1,8-8H96a8,8,0,0,1,0,16H80A8,8,0,0,1,72,112Zm96,0a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H176A8,8,0,0,1,168,112Zm-48-8h16a8,8,0,0,1,0,16H120a8,8,0,0,1,0-16Zm0,32h16a8,8,0,0,1,0,16H120a8,8,0,0,1,0-16Zm-40,0H96a8,8,0,0,1,0,16H80a8,8,0,0,1,0-16Zm96,0h16a8,8,0,0,1,0,16H176a8,8,0,0,1,0-16Z"/>
            </svg>
          </div>
          <div class="split-info">
            <span class="split-label">{{ t('coding.manual') }}</span>
            <span class="split-time">{{ formatDuration(manualCodingTime) }}</span>
          </div>
          <div class="split-percent">{{ 100 - aiCodingPercent }}%</div>
        </div>
        <div class="split-divider"></div>
        <div class="split-item ai">
          <div class="split-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
              <path d="M200,112a8,8,0,0,1-8,8H152a8,8,0,0,1,0-16h40A8,8,0,0,1,200,112Zm-8,24H152a8,8,0,0,0,0,16h40a8,8,0,0,0,0-16Zm-32,32H152a8,8,0,0,0,0,16h8a8,8,0,0,0,0-16ZM96,208H72a8,8,0,0,1-8-8V160a8,8,0,0,1,16,0v32H96a8,8,0,0,1,0,16Zm0-96H80V80a8,8,0,0,0-16,0v40a8,8,0,0,0,8,8H96a8,8,0,0,0,0-16ZM232,56V200a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56Zm-16,0H40V200H216V56Z"/>
            </svg>
          </div>
          <div class="split-info">
            <span class="split-label">{{ t('coding.ai') }}</span>
            <span class="split-time">{{ formatDuration(totalAiCodingTime) }}</span>
          </div>
          <div class="split-percent">{{ aiCodingPercent }}%</div>
        </div>
      </div>
      <div class="split-bar-bg">
        <div class="split-bar-manual" :style="{ width: (100 - aiCodingPercent) + '%' }"></div>
        <div class="split-bar-ai" :style="{ width: aiCodingPercent + '%' }"></div>
      </div>
    </div>

    <div class="coding-languages" v-if="topCodingLanguages.length > 0">
      <div class="subsection-title">{{ t('coding.languages') }}</div>
      <div class="lang-grid">
        <div v-for="lang in topCodingLanguages" :key="lang.language" class="lang-card">
          <div class="lang-header">
            <span class="lang-color-dot" :style="{ background: getLangColor(lang.language) }"></span>
            <span class="lang-name">{{ lang.language === 'Unknown' ? t('coding.unknownCoding') : lang.language }}</span>
            <span class="lang-sessions">{{ lang.session_count }} {{ t('coding.sessions') }}</span>
          </div>
          <div class="lang-time-row">
            <span class="lang-total">{{ formatDuration(lang.total_seconds) }}</span>
            <div class="lang-split-mini" v-if="lang.ai_seconds > 0">
              <span class="mini-manual">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 256 256" fill="currentColor" style="display:inline;vertical-align:middle;margin-right:2px;">
                  <path d="M223.51,48h-191A16.51,16.51,0,0,0,16,64.49v111A16.51,16.51,0,0,0,32.49,192h72.28l-8.21,24.62A8,8,0,0,0,104.15,224h47.7a8,8,0,0,0,7.59-10.38L151.23,192h72.28A16.51,16.51,0,0,0,240,175.51v-111A16.51,16.51,0,0,0,223.51,48ZM224,175.51a.49.49,0,0,1-.49.49H32.49a.49.49,0,0,1-.49-.49v-111a.49.49,0,0,1,.49-.49h191a.49.49,0,0,1,.49.49ZM72,112a8,8,0,0,1,8-8H96a8,8,0,0,1,0,16H80A8,8,0,0,1,72,112Zm96,0a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H176A8,8,0,0,1,168,112Zm-48-8h16a8,8,0,0,1,0,16H120a8,8,0,0,1,0-16Zm0,32h16a8,8,0,0,1,0,16H120a8,8,0,0,1,0-16Zm-40,0H96a8,8,0,0,1,0,16H80a8,8,0,0,1,0-16Zm96,0h16a8,8,0,0,1,0,16H176a8,8,0,0,1,0-16Z"/>
                </svg>
                {{ formatDuration(lang.manual_seconds) }}
              </span>
              <span class="mini-ai">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 256 256" fill="currentColor" style="display:inline;vertical-align:middle;margin-right:2px;">
                  <path d="M200,112a8,8,0,0,1-8,8H152a8,8,0,0,1,0-16h40A8,8,0,0,1,200,112Zm-8,24H152a8,8,0,0,0,0,16h40a8,8,0,0,0,0-16Zm-32,32H152a8,8,0,0,0,0,16h8a8,8,0,0,0,0-16ZM96,208H72a8,8,0,0,1-8-8V160a8,8,0,0,1,16,0v32H96a8,8,0,0,1,0,16Zm0-96H80V80a8,8,0,0,0-16,0v40a8,8,0,0,0,8,8H96a8,8,0,0,0,0-16ZM232,56V200a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56Zm-16,0H40V200H216V56Z"/>
                </svg>
                {{ formatDuration(lang.ai_seconds) }}
              </span>
            </div>
          </div>
          <div class="lang-bar-bg">
            <div class="lang-bar-manual" :style="{ width: getManualPct(lang) + '%' }"></div>
            <div class="lang-bar-ai" :style="{ width: getAiPct(lang) + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="coding-projects" v-if="topCodingProjects.length > 0">
      <div class="subsection-title">{{ t('coding.projects') }}</div>
      <div class="project-list">
        <div v-for="(proj, idx) in topCodingProjects" :key="proj.project_dir" class="project-item">
          <div class="project-rank" :class="getRankClass(idx)">{{ idx + 1 }}</div>
          <div class="project-info">
            <div class="project-name" :title="proj.project_dir">{{ proj.project_dir }}</div>
            <div class="project-bar-bg">
              <div class="project-bar-fill"
                :style="{ width: getProjectPct(proj) + '%', background: getProjectGradient(idx) }">
              </div>
            </div>
          </div>
          <div class="project-meta">
            <div class="project-time">{{ formatDuration(proj.total_seconds) }}</div>
            <div class="project-ai" v-if="proj.ai_seconds > 0">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 256 256" fill="currentColor" style="display:inline;vertical-align:middle;margin-right:2px;">
                <path d="M200,112a8,8,0,0,1-8,8H152a8,8,0,0,1,0-16h40A8,8,0,0,1,200,112Zm-8,24H152a8,8,0,0,0,0,16h40a8,8,0,0,0,0-16Zm-32,32H152a8,8,0,0,0,0,16h8a8,8,0,0,0,0-16ZM96,208H72a8,8,0,0,1-8-8V160a8,8,0,0,1,16,0v32H96a8,8,0,0,1,0,16Zm0-96H80V80a8,8,0,0,0-16,0v40a8,8,0,0,0,8,8H96a8,8,0,0,0,0-16ZM232,56V200a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56Zm-16,0H40V200H216V56Z"/>
              </svg>
              {{ formatDuration(proj.ai_seconds) }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="coding-files" v-if="fileStats.length > 0">
      <div class="subsection-header" @click="isFilesExpanded = !isFilesExpanded">
        <span class="subsection-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:middle;margin-right:6px;">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          {{ t('coding.files_worked') }}
        </span>
        <button class="expand-btn">
          {{ isFilesExpanded ? t('coding.hide_files') : t('coding.show_files') }}
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" :class="{ rotated: isFilesExpanded }">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>

      <div class="files-list" v-if="isFilesExpanded">
        <div v-for="file in fileStats" :key="file.filePath + file.language + file.projectDir" class="file-item-card">
          <div class="file-main-info">
            <div class="file-meta">
              <span class="lang-color-dot" :style="{ background: getLangColor(file.language) }"></span>
              <span class="file-name" :title="file.filePath">{{ file.filePath === 'Workspace / General' ? t('coding.workspaceGeneral') : file.filePath }}</span>
              <span class="lang-tag" v-if="file.language">{{ file.language === 'Unknown' ? t('coding.unknownCoding') : file.language }}</span>
            </div>
            <div class="file-project" :title="file.projectDir">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 256 256" fill="currentColor" style="display:inline;vertical-align:middle;margin-right:4px;">
                <path d="M216,72H131.31L104,44.69A15.86,15.86,0,0,0,92.69,40H40A16,16,0,0,0,24,56V200.62A15.4,15.4,0,0,0,39.38,216H216.89A15.13,15.13,0,0,0,232,200.89V88A16,16,0,0,0,216,72ZM40,56H92.69l16,16H40ZM216,200H40V88H216Z"/>
              </svg>
              {{ file.projectDir === 'No Project' ? t('coding.noProject') : file.projectDir }}
            </div>
          </div>

          <div class="file-split-section">
            <div class="file-duration-container">
              <span class="file-duration-total">{{ formatDuration(file.totalSeconds) }}</span>
              <div class="file-split-mini">
                <span class="mini-manual" v-if="file.manualSeconds > 0">
                  {{ formatDuration(file.manualSeconds) }}
                </span>
                <span class="mini-ai" v-if="file.aiSeconds > 0">
                  {{ formatDuration(file.aiSeconds) }} {{ t('coding.ai', 'AI') }}
                </span>
              </div>
            </div>
            <div class="file-split-bar" v-if="file.totalSeconds > 0">
              <div class="file-bar-manual" :style="{ width: (100 - file.aiPercent) + '%' }"></div>
              <div class="file-bar-ai" :style="{ width: file.aiPercent + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useActivityStore, type CodingSession } from '../stores/activity';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  sessions: CodingSession[];
  isToday: boolean;
}>();

const store = useActivityStore();
const { t } = useI18n();

const isFilesExpanded = ref(true);

const totalCodingTime = computed(() => {
  return props.sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
});

const totalAiCodingTime = computed(() => {
  return props.sessions.reduce((acc, s) => acc + (s.is_ai_assisted ? (s.duration_seconds || 0) : 0), 0);
});

const manualCodingTime = computed(() => {
  return totalCodingTime.value - totalAiCodingTime.value;
});

const aiCodingPercent = computed(() => {
  if (totalCodingTime.value === 0) return 0;
  return Math.round((totalAiCodingTime.value / totalCodingTime.value) * 100);
});

const topCodingLanguages = computed(() => {
  const langMap: Record<string, {
    language: string;
    total_seconds: number;
    manual_seconds: number;
    ai_seconds: number;
    session_count: number;
  }> = {};

  props.sessions.forEach(s => {
    const lang = s.language || 'Unknown';
    if (!langMap[lang]) {
      langMap[lang] = {
        language: lang,
        total_seconds: 0,
        manual_seconds: 0,
        ai_seconds: 0,
        session_count: 0
      };
    }
    const duration = s.duration_seconds || 0;
    langMap[lang].total_seconds += duration;
    langMap[lang].session_count += 1;
    if (s.is_ai_assisted) {
      langMap[lang].ai_seconds += duration;
    } else {
      langMap[lang].manual_seconds += duration;
    }
  });

  return Object.values(langMap).sort((a, b) => b.total_seconds - a.total_seconds);
});

const topCodingProjects = computed(() => {
  const projMap: Record<string, {
    project_dir: string;
    total_seconds: number;
    ai_seconds: number;
  }> = {};

  props.sessions.forEach(s => {
    const proj = s.project_dir || 'No Project';
    if (!projMap[proj]) {
      projMap[proj] = {
        project_dir: proj,
        total_seconds: 0,
        ai_seconds: 0
      };
    }
    const duration = s.duration_seconds || 0;
    projMap[proj].total_seconds += duration;
    if (s.is_ai_assisted) {
      projMap[proj].ai_seconds += duration;
    }
  });

  return Object.values(projMap).sort((a, b) => b.total_seconds - a.total_seconds);
});

const mostActiveLanguage = computed(() => {
  if (topCodingLanguages.value.length === 0) return null;
  const top = topCodingLanguages.value[0];
  const pct = totalCodingTime.value > 0 ? Math.round((top.total_seconds / totalCodingTime.value) * 100) : 0;
  return { language: top.language, pct };
});

const fileStats = computed(() => {
  const fileMap: Record<string, {
    filePath: string;
    language: string;
    projectDir: string;
    totalSeconds: number;
    aiSeconds: number;
    manualSeconds: number;
  }> = {};

  props.sessions.forEach(session => {
    let file = session.file_path || 'Workspace / General';
    if (file.includes('/') || file.includes('\\')) {
      const parts = file.split(/[/\\]/);
      file = parts[parts.length - 1];
    }
    if (file.trim() === '') {
      file = 'Workspace / General';
    }

    const lang = session.language || 'Unknown';
    const proj = session.project_dir || 'No Project';

    const key = `${file}|${lang}|${proj}`;

    if (!fileMap[key]) {
      fileMap[key] = {
        filePath: file,
        language: lang,
        projectDir: proj,
        totalSeconds: 0,
        aiSeconds: 0,
        manualSeconds: 0
      };
    }

    const duration = session.duration_seconds || 0;
    fileMap[key].totalSeconds += duration;
    if (session.is_ai_assisted) {
      fileMap[key].aiSeconds += duration;
    } else {
      fileMap[key].manualSeconds += duration;
    }
  });

  return Object.values(fileMap)
    .map(f => ({
      ...f,
      aiPercent: f.totalSeconds > 0 ? Math.round((f.aiSeconds / f.totalSeconds) * 100) : 0
    }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds);
});

function formatDuration(seconds: number): string {
  const h_sym = t('common.h_symbol', 'h');
  const m_sym = t('common.m_symbol', 'm');
  const s_sym = t('common.s_symbol', 's');
  if (seconds < 60) return `${seconds}${s_sym}`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}${m_sym}`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}${h_sym} ${rem}${m_sym}` : `${hrs}${h_sym}`;
}

function getEditorClass(editor: string): string {
  const e = editor.toLowerCase();
  if (e.includes('cursor') || e.includes('windsurf')) return 'editor-ai';
  if (e.includes('code') || e.includes('vs code')) return 'editor-vscode';
  if (e.includes('zed')) return 'editor-zed';
  if (e.includes('neovim') || e.includes('vim')) return 'editor-vim';
  if (e.includes('jetbrains') || e.includes('intellij') || e.includes('webstorm') ||
      e.includes('pycharm') || e.includes('clion') || e.includes('goland')) return 'editor-jetbrains';
  return 'editor-default';
}

const LANG_COLORS: Record<string, string> = {
  'Rust': '#CE422B',
  'TypeScript': '#3178C6',
  'JavaScript': '#F7DF1E',
  'Python': '#3776AB',
  'Go': '#00ADD8',
  'Ruby': '#CC342D',
  'Java': '#ED8B00',
  'Kotlin': '#7F52FF',
  'Swift': '#FA7343',
  'C': '#A8B9CC',
  'C++': '#00599C',
  'C#': '#239120',
  'PHP': '#777BB4',
  'HTML': '#E34C26',
  'CSS': '#1572B6',
  'Vue': '#42B883',
  'Svelte': '#FF3E00',
  'Markdown': '#083FA1',
  'JSON': '#292929',
  'YAML': '#CB171E',
  'TOML': '#9C4121',
  'Shell': '#4EAA25',
  'PowerShell': '#012456',
  'SQL': '#336791',
  'Lua': '#000080',
  'Dart': '#0175C2',
  'Elixir': '#6E4A7E',
  'Haskell': '#5D4F85',
  'Clojure': '#5881D8',
  'R': '#276DC3',
  'XML': '#F60',
  'HCL': '#7B42BC',
  'Zig': '#F7A41D',
  'Unknown': '#888',
};

function getLangColor(lang: string | null): string {
  if (!lang) return '#888';
  return LANG_COLORS[lang] || '#888';
}

function getManualPct(lang: { total_seconds: number; manual_seconds: number }): number {
  if (lang.total_seconds === 0) return 100;
  return Math.round((lang.manual_seconds / lang.total_seconds) * 100);
}

function getAiPct(lang: { total_seconds: number; ai_seconds: number }): number {
  if (lang.total_seconds === 0) return 0;
  return Math.round((lang.ai_seconds / lang.total_seconds) * 100);
}

function getProjectPct(proj: { total_seconds: number }): number {
  const max = topCodingProjects.value[0]?.total_seconds || 1;
  return Math.round((proj.total_seconds / max) * 100);
}

const PROJECT_GRADIENTS = [
  'var(--bg-tertiary)',
  'var(--bg-tertiary)',
  'var(--bg-tertiary)',
  'var(--bg-tertiary)',
  'var(--bg-tertiary)',
  'var(--bg-tertiary)',
];

function getProjectGradient(idx: number): string {
  return PROJECT_GRADIENTS[idx % PROJECT_GRADIENTS.length];
}

function getRankClass(idx: number): string {
  if (idx === 0) return 'gold';
  if (idx === 1) return 'silver';
  if (idx === 2) return 'bronze';
  return '';
}
</script>

<style scoped>
.coding-tracker-section {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.section-header h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
}

.header-badges {
  display: flex;
  gap: 8px;
  align-items: center;
}

.header-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.coding-badge {
  background: var(--bg-tertiary), rgba(139,92,246,0.2));
  border: 1px solid rgba(99,102,241,0.35);
  color: #a5b4fc;
}

.ai-badge {
  background: var(--bg-tertiary), rgba(5,150,105,0.2));
  border: 1px solid rgba(16,185,129,0.35);
  color: #6ee7b7;
}

.now-coding {
  background: var(--bg-tertiary), rgba(139,92,246,0.08));
  border: 1px solid rgba(99,102,241,0.25);
  border-radius: 12px;
  padding: 14px 16px;
}

.now-coding-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.8rem;
  margin-bottom: 10px;
}

.now-coding-header svg {
  color: #a5b4fc;
}

.live-badge {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(239,68,68,0.15);
  border: 1px solid rgba(239,68,68,0.3);
  color: #fca5a5;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ef4444;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.now-coding-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.coding-editor-badge {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.editor-vscode { background: rgba(0,122,204,0.2); color: #007ACC; border: 1px solid rgba(0,122,204,0.3); }
.editor-zed { background: rgba(83,191,162,0.2); color: #53BFA2; border: 1px solid rgba(83,191,162,0.3); }
.editor-vim { background: rgba(24,157,94,0.2); color: #189D5E; border: 1px solid rgba(24,157,94,0.3); }
.editor-jetbrains { background: rgba(255,49,140,0.15); color: #FF318C; border: 1px solid rgba(255,49,140,0.25); }
.editor-ai { background: rgba(16,185,129,0.2); color: #10b981; border: 1px solid rgba(16,185,129,0.35); }
.editor-default { background: rgba(148,163,184,0.15); color: #94a3b8; border: 1px solid rgba(148,163,184,0.2); }

.coding-file-info {
  flex: 1;
  min-width: 0;
}

.coding-file {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.lang-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.file-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lang-tag {
  font-size: 0.68rem;
  padding: 1px 6px;
  background: rgba(148,163,184,0.12);
  border-radius: 4px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.coding-project {
  font-size: 0.75rem;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-indicator {
  padding: 3px 10px;
  background: rgba(16,185,129,0.15);
  border: 1px solid rgba(16,185,129,0.3);
  border-radius: 20px;
  font-size: 0.72rem;
  color: #6ee7b7;
  white-space: nowrap;
}

.coding-split-card {
  background: var(--bg-card, rgba(255,255,255,0.04));
  border: 1px solid var(--border-color, rgba(255,255,255,0.08));
  border-radius: 12px;
  padding: 16px;
}

.split-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.split-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.split-icon { font-size: 1.3rem; }

.split-info {
  display: flex;
  flex-direction: column;
}

.split-label {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.split-time {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.split-percent {
  margin-left: auto;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
}

.split-divider {
  width: 1px;
  height: 40px;
  background: var(--border-color, rgba(255,255,255,0.1));
}

.split-bar-bg {
  height: 8px;
  border-radius: 4px;
  background: rgba(255,255,255,0.06);
  overflow: hidden;
  display: flex;
}

.split-bar-manual {
  height: 100%;
  background: var(--bg-tertiary);
  border-radius: 4px 0 0 4px;
  transition: width 0.5s ease;
}

.split-bar-ai {
  height: 100%;
  background: var(--bg-tertiary);
  border-radius: 0 4px 4px 0;
  transition: width 0.5s ease;
}

.subsection-title {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 10px;
}

.lang-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.lang-card {
  background: var(--bg-card, rgba(255,255,255,0.04));
  border: 1px solid var(--border-color, rgba(255,255,255,0.08));
  border-radius: 10px;
  padding: 12px;
  transition: border-color 0.2s;
}

.lang-card:hover {
  border-color: rgba(99,102,241,0.35);
}

.lang-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.lang-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.lang-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.lang-sessions {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.lang-time-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.lang-total {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
}

.lang-split-mini {
  display: flex;
  gap: 6px;
  font-size: 0.65rem;
}

.mini-manual { color: #a5b4fc; }
.mini-ai { color: #6ee7b7; }

.lang-bar-bg {
  height: 4px;
  border-radius: 2px;
  background: rgba(255,255,255,0.06);
  overflow: hidden;
  display: flex;
}

.lang-bar-manual {
  height: 100%;
  background: #6366f1;
  transition: width 0.5s ease;
}

.lang-bar-ai {
  height: 100%;
  background: #10b981;
  transition: width 0.5s ease;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-card, rgba(255,255,255,0.04));
  border: 1px solid var(--border-color, rgba(255,255,255,0.08));
  border-radius: 10px;
  padding: 10px 14px;
  transition: border-color 0.2s;
}

.project-item:hover {
  border-color: rgba(99,102,241,0.3);
}

.project-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  flex-shrink: 0;
  background: rgba(148,163,184,0.15);
  color: var(--text-muted);
}

.project-rank.gold { background: rgba(234,179,8,0.2); color: #eab308; }
.project-rank.silver { background: rgba(148,163,184,0.2); color: #94a3b8; }
.project-rank.bronze { background: rgba(180,83,9,0.2); color: #b45309; }

.project-info {
  flex: 1;
  min-width: 0;
}

.project-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 5px;
}

.project-bar-bg {
  height: 4px;
  border-radius: 2px;
  background: rgba(255,255,255,0.06);
  overflow: hidden;
}

.project-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.project-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.project-time {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
}

.project-ai {
  font-size: 0.65rem;
  color: #6ee7b7;
}

@media (max-width: 600px) {
  .lang-grid {
    grid-template-columns: 1fr 1fr;
  }

  .split-row {
    gap: 8px;
  }

  .split-time {
    font-size: 0.85rem;
  }
}

@media (max-width: 400px) {
  .lang-grid {
    grid-template-columns: 1fr;
  }
}

.active-lang-badge {
  background: var(--bg-tertiary), rgba(202,138,4,0.15));
  border: 1px solid rgba(234,179,8,0.3);
  color: #fef08a;
  display: flex;
  align-items: center;
  gap: 4px;
}

.coding-files {
  margin-top: 16px;
  background: var(--bg-card, rgba(255,255,255,0.03));
  border: 1px solid var(--border-color, rgba(255,255,255,0.06));
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.subsection-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.expand-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.expand-btn svg {
  transition: transform 0.2s ease;
}

.expand-btn svg.rotated {
  transform: rotate(180deg);
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 350px;
  overflow-y: auto;
  padding-right: 4px;
}

.file-item-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  transition: border-color 0.2s, background-color 0.2s;
}

.file-item-card:hover {
  background: rgba(255,255,255,0.03);
  border-color: rgba(99,102,241,0.25);
}

.file-main-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-project {
  font-size: 0.7rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-split-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  width: 140px;
  flex-shrink: 0;
}

.file-duration-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}

.file-duration-total {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.file-split-mini {
  display: flex;
  gap: 6px;
  font-size: 0.65rem;
}

.file-split-mini .mini-manual {
  color: #a5b4fc;
}

.file-split-mini .mini-ai {
  color: #6ee7b7;
}

.file-split-bar {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: rgba(255,255,255,0.06);
  overflow: hidden;
  display: flex;
}

.file-bar-manual {
  height: 100%;
  background: #6366f1;
}

.file-bar-ai {
  height: 100%;
  background: #10b981;
}

.files-list::-webkit-scrollbar {
  width: 4px;
}

.files-list::-webkit-scrollbar-track {
  background: transparent;
}

.files-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.files-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
