<template>
  <div class="teams-page" @mousemove="onDrag" @mouseup="stopDrag">
    
    <!-- 1. FULLSCREEN LAYERS (Auth & Lobby) -->
    <Transition name="fade">
      <div v-if="!store.isConnected" class="fullscreen-layer">
        
        <!-- A. Identity Setup -->
        <div v-if="!store.myProfile.name" class="center-content">
           <div class="glass-panel setup-panel animate-up">
              <div class="panel-icon">🔑</div>
              <h1>Welcome to Teams</h1>
              <p class="subtitle">Collaborate with your team in real-time.</p>
              
              <div class="auth-section">
                  <div v-if="googleAccount" class="account-preview">
                      <div class="avatar-circle">{{ googleAccount.email[0].toUpperCase() }}</div>
                      <div class="account-info">
                          <span class="name">{{ googleAccount.name }}</span>
                          <span class="email">{{ googleAccount.email }}</span>
                      </div>
                      <button class="btn btn-primary" @click="loginWithGoogle">Continue</button>
                  </div>
                  <div v-else>
                      <button class="btn btn-google" @click="startGoogleAuth">
                          <span>G</span> Sign in with Google
                      </button>
                  </div>
              </div>
              
              <div class="hero-foot">
                  <input v-model="tempName" placeholder="Or enter a nickname..." class="input-minimal" @change="saveProfile()" />
              </div>
           </div>
        </div>

        <!-- B. Lobby (Join/Create) -->
         <div v-else class="lobby-fullscreen">
           <!-- Fixed Top Header -->
           <div class="lobby-header">
               <div class="user-badge glass-panel">
                   <span class="avatar-small">{{ store.myProfile.name[0] }}</span>
                   <div class="user-info">
                       <span class="user-name">{{ store.myProfile.name }}</span>
                       <button class="btn-text-sm danger" @click="logout">Logout</button>
                   </div>
               </div>
           </div>
           
           <!-- Centered Lobby Content -->
           <div class="lobby-center">
               <div class="lobby-wrapper animate-up">
                   <div class="lobby-title">
                       <h2>Join or Create a Team</h2>
                       <p class="subtitle">Collaborate with your team in real-time</p>
                   </div>
                   
                   <div class="lobby-options">
                       <!-- Join Card -->
                       <div class="glass-card option-card">
                           <div class="card-icon">👋</div>
                           <h3>Join Team</h3>
                           <p class="card-desc">Enter a team ID to join an existing session</p>
                           <div class="input-group">
                               <input v-model="joinId" placeholder="Enter Team ID" :disabled="isJoining" @input="joinError = ''" />
                               <button class="btn btn-accent" :disabled="!joinId || isJoining" @click="joinTeam">
                                   {{ isJoining ? 'Connecting...' : 'Join' }}
                               </button>
                           </div>
                           <p v-if="joinError" class="error-msg">{{ joinError }}</p>
                       </div>
                       
                       <!-- Separator -->
                       <div class="or-divider">
                           <span>OR</span>
                       </div>

                       <!-- Create Card -->
                       <div class="glass-card option-card primary-glow">
                           <div class="card-icon">🚀</div>
                           <h3>Create Team</h3>
                           <p class="card-desc">Start a new session as leader</p>
                           <button class="btn btn-primary full" @click="createTeam">Start Now</button>
                       </div>
                   </div>
               </div>
           </div>
         </div>

      </div>
    </Transition>


    <!-- 2. MAIN INTERFACE (Connected) -->
    <div v-if="store.isConnected" class="main-interface">
        
        <!-- LEFT: STAGE AREA -->
        <div class="stage-area" :class="{ 'theater-mode': isTheaterMode }">
            
            <!-- Video Grid -->
            <div class="video-stage">
                <!-- Featured / Screen Share -->
                <div class="featured-view" v-if="featuredPeerId">
                     <video :srcObject="featuredStream" autoplay playsinline class="featured-video"></video>
                     <div class="featured-label">
                         <span class="badge red" v-if="isFeaturedSharing">Screen Share</span>
                         {{ featuredName }}
                     </div>
                     <button class="btn-close-feature" @click="featuredPeerId = null">✕ Minimize</button>
                </div>

                <!-- Normal Grid -->
                <div class="grid-view" :class="{ 'strip-row': featuredPeerId, 'single-view': store.members.length === 1 && !featuredPeerId }">
                     
                     <!-- Remote Peers -->
                     <div class="video-item" v-for="[peerId, stream] in store.remoteStreams" :key="peerId" @click="setFeatured(peerId)">
                         <video :srcObject="stream" autoplay playsinline></video>
                         <div class="peer-name">{{ getMemberName(peerId) }}</div>
                     </div>
                     
                     <!-- Local Self (If not featured) -->
                     <div class="video-item local" v-if="store.localStream && featuredPeerId !== store.myProfile.id">
                         <video :srcObject="store.localStream" autoplay playsinline muted></video>
                         <div class="peer-name">You</div>
                     </div>
                     
                     <!-- Empty State -->
                     <div class="empty-stage" v-if="store.remoteStreams.size === 0 && !store.localStream && !featuredPeerId">
                         <div class="empty-icon">🎧</div>
                         <h3>Waiting for people...</h3>
                         <p>Share your ID: <span class="code" @click="copyId">{{ store.myProfile.id }}</span></p>
                     </div>
                </div>
            </div>

            <!-- Floating Controls Bottom -->
            <div class="control-bar-wrapper">
                <div class="control-bar glass-panel">
                    <button class="ctrl-btn" :class="{ off: isMuted }" @click="store.toggleMute()" title="Mic">
                        <svg v-if="!isMuted" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                    </button>
                    <button class="ctrl-btn" :class="{ off: !isCameraOn }" @click="store.toggleCamera()" title="Camera">
                        <svg v-if="isCameraOn" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"></path></svg>
                    </button>
                    <div class="sep"></div>
                    <button class="ctrl-btn" :class="{ active: isScreenSharing }" @click="showScreenPicker = true" title="Share Screen">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                    </button>
                    <button class="ctrl-btn" @click="toggleTheater" title="Theater Mode">
                         <svg v-if="isTheaterMode" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>
                         <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path></svg>
                    </button>
                    <button class="ctrl-btn" @click="openDeviceSettings" title="Settings">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.82 1.82l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    </button>
                    <div class="sep"></div>
                    <button class="ctrl-btn danger" @click="showLeaveModal = true" title="Leave">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path><line x1="23" y1="1" x2="1" y2="23"></line></svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- RIGHT: SIDEBAR (Tabs) -->
        <Transition name="slide-right">
        <div class="sidebar-area glass-panel" v-if="!isTheaterMode">
             <!-- Tabs Header -->
             <div class="tabs-header">
                 <button class="tab-btn" :class="{ active: currentTab === 'chat' }" @click="currentTab = 'chat'">
                    💬 Chat
                 </button>
                 <button class="tab-btn" :class="{ active: currentTab === 'people' }" @click="currentTab = 'people'">
                    👥 ({{ store.members.length }})
                 </button>
                 <button class="tab-btn" :class="{ active: currentTab === 'goals' }" @click="currentTab = 'goals'">
                    🎯 Goals
                 </button>
             </div>

             <!-- Tab Content -->
             <div class="tab-content">
                 
                 <!-- CHAT TAB -->
                 <div v-if="currentTab === 'chat'" class="tab-pane chat-pane">
                     <div v-if="!isChatDetached" class="chat-container-inner">
                        <div class="chat-header-actions">
                             <span class="text-sm text-muted">Team Chat</span>
                             <button class="btn-icon-xs" title="Pop out chat" @click="detachChat">↗</button>
                        </div>
                        <div class="msg-list" ref="chatBox">
                             <div class="sys-msg">Team created. Welcome!</div>
                             <div class="msg-row" v-for="msg in store.messages" :key="msg.id" :class="{ mine: msg.senderId === store.myProfile.id }">
                                 <div class="msg-meta" v-if="msg.senderId !== store.myProfile.id">{{ msg.senderName }}</div>
                                 <div class="msg-bubble">{{ msg.text }}</div>
                             </div>
                         </div>
                         <div class="chat-input-area">
                             <input v-model="chatMsg" @keyup.enter="sendChat" placeholder="Type..." />
                             <button @click="sendChat">➤</button>
                         </div>
                     </div>
                     <div v-else class="detached-placeholder">
                         <p>Chat is popped out.</p>
                         <button class="btn btn-outline small" @click="attachChat">Restore Chat</button>
                     </div>
                 </div>

                 <!-- PEOPLE TAB -->
                 <div v-if="currentTab === 'people'" class="tab-pane people-pane">
                     <div class="section-title">In Call</div>
                     <div class="member-list">
                         <div class="member-card" v-for="m in store.members" :key="m.id">
                             <div class="m-avatar" :class="{ voice: m.status === 'voice' }">{{ m.name[0] }}</div>
                             <div class="m-info">
                                 <div class="m-name">{{ m.name }} <span v-if="m.isLeader">👑</span></div>
                                 <div class="m-status">{{ m.currentApp || 'Idle' }}</div>
                             </div>
                             <button v-if="store.isLeader && m.id !== store.myProfile.id" class="btn-icon-sm" @click="kickMember(m.id)">✕</button>
                         </div>
                     </div>
                     
                     <div class="invite-box">
                         <label>Invite ID</label>
                         <div class="copy-row" @click="copyId">
                             <span>{{ store.myProfile.id }}</span>
                             <span class="copy-icon">📋</span>
                         </div>
                     </div>
                 </div>

                 <!-- GOALS TAB -->
                 <div v-if="currentTab === 'goals'" class="tab-pane goals-pane">
                     <!-- Active Goal -->
                     <div class="goal-active-card glass-card" v-if="store.activeGoal && store.activeGoal.status === 'active'">
                         <div class="goal-head">
                             <span class="g-icon">🔥</span>
                             <div>
                                 <h4>{{ store.activeGoal.appName }}</h4>
                                 <small>{{ Math.floor(store.activeGoal.targetSeconds / 60) }} min target</small>
                             </div>
                         </div>
                         
                         <!-- Live Tracking Indicator -->
                         <div class="tracking-status" :class="{ active: isTrackingGoal }">
                             <span class="dot"></span>
                             <span>{{ isTrackingGoal ? 'Tracking Active' : 'Waiting for app...' }}</span>
                         </div>

                         <div class="admin-btns" v-if="store.isLeader">
                             <button class="btn-xs success" @click="store.updateGoalStatus('completed')">Done</button>
                             <button class="btn-xs danger" @click="store.updateGoalStatus('failed')">Fail</button>
                         </div>
                     </div>

                     <!-- Set Goal -->
                     <div v-else class="empty-goals">
                         <p>No active team goal.</p>
                         <button v-if="store.isLeader" class="btn btn-primary small" @click="showGoalModal = true">Set Goal</button>
                     </div>

                     <!-- Progress List -->
                     <div class="progress-list">
                         <div class="p-item" v-for="m in store.members" :key="m.id">
                             <div class="p-head">
                                 <span>{{ m.name }}</span>
                                 <span>{{ m.progress?.percentage || 0 }}%</span>
                             </div>
                             <div class="p-track">
                                 <div class="p-fill" :style="{ width: (m.progress?.percentage || 0) + '%' }"></div>
                             </div>
                         </div>
                     </div>
                 </div>

             </div>
        </div>
        </Transition>

        <!-- FLOATING CHAT WINDOW -->
        <div v-if="isChatDetached" class="floating-chat glass-panel" :style="{ top: chatPos.y + 'px', left: chatPos.x + 'px' }">
             <div class="float-header" @mousedown="startDrag">
                 <span>💬 Chat</span>
                 <button class="btn-close-sm" @click="attachChat">✕</button>
             </div>
             <div class="msg-list" ref="detachedChatBox">
                 <div class="sys-msg">Team created. Welcome!</div>
                 <div class="msg-row" v-for="msg in store.messages" :key="msg.id" :class="{ mine: msg.senderId === store.myProfile.id }">
                     <div class="msg-meta" v-if="msg.senderId !== store.myProfile.id">{{ msg.senderName }}</div>
                     <div class="msg-bubble">{{ msg.text }}</div>
                 </div>
             </div>
             <div class="chat-input-area">
                 <input v-model="chatMsg" @keyup.enter="sendChat" placeholder="Type..." />
                 <button @click="sendChat">➤</button>
             </div>
        </div>

    </div>

    <!-- MODALS -->
    
    <!-- Goal Modal -->
    <div class="modal-backdrop" v-if="showGoalModal" @click.self="showGoalModal = false">
        <div class="glass-panel modal">
            <h2>🎯 New Goal</h2>
            <input v-model="goalApp" placeholder="App Name (e.g. VS Code)" class="input-std" />
            <div class="time-opts">
                <button v-for="t in [15,30,60]" :key="t" @click="goalMinutes=t" :class="{selected: goalMinutes===t}">{{t}}m</button>
            </div>
            <button class="btn btn-primary full" @click="createGoal">Set Goal</button>
        </div>
    </div>

    <!-- Settings Modal - Premium A/V Settings -->
    <div class="modal-backdrop" v-if="showDeviceSettings" @click.self="showDeviceSettings = false">
        <div class="glass-panel modal av-settings-modal">
            <div class="modal-header">
                <div class="modal-title">
                    <span class="modal-icon">🎛️</span>
                    <h2>Audio & Video</h2>
                </div>
                <button class="btn-close-modal" @click="showDeviceSettings = false">✕</button>
            </div>
            
            <div class="modal-body">
                <div class="setting-section">
                    <label class="setting-label">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                            <line x1="12" y1="19" x2="12" y2="23"></line>
                            <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                        Microphone
                    </label>
                    <div class="custom-select-wrapper">
                        <select class="styled-select" v-model="store.selectedAudioInput" @change="store.switchAudioInput(store.selectedAudioInput)">
                            <option v-for="d in store.audioInputDevices" :key="d.deviceId" :value="d.deviceId">{{ d.label || 'Default Microphone' }}</option>
                        </select>
                        <span class="select-arrow">▼</span>
                    </div>
                </div>
                
                <div class="setting-section">
                    <label class="setting-label">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        </svg>
                        Speaker
                    </label>
                    <div class="custom-select-wrapper">
                        <select class="styled-select" v-model="store.selectedAudioOutput">
                            <option v-for="d in store.audioOutputDevices" :key="d.deviceId" :value="d.deviceId">{{ d.label || 'Default Speaker' }}</option>
                        </select>
                        <span class="select-arrow">▼</span>
                    </div>
                </div>

                <div class="setting-section">
                    <label class="setting-label">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                            <circle cx="12" cy="13" r="4"></circle>
                        </svg>
                        Camera
                    </label>
                    <div class="custom-select-wrapper">
                        <select class="styled-select">
                            <option v-for="d in store.videoInputDevices" :key="d.deviceId" :value="d.deviceId">{{ d.label || 'Default Camera' }}</option>
                        </select>
                        <span class="select-arrow">▼</span>
                    </div>
                </div>
            </div>
            
            <div class="modal-footer">
                <button class="btn btn-primary full" @click="showDeviceSettings = false">Done</button>
            </div>
        </div>
    </div>

    <!-- Leave Team Confirmation Modal -->
    <div class="modal-overlay" v-if="showLeaveModal" @click.self="showLeaveModal = false">
        <div class="glass-card modal-content small-modal">
            <div class="modal-header center">
                 <div class="modal-icon warning">⚠️</div>
                 <h3>Leave Team?</h3>
            </div>
            <div class="modal-body text-center">
                <p>Are you sure you want to disconnect from this session?</p>
            </div>
            <div class="modal-footer two-col">
                <button class="btn btn-text" @click="showLeaveModal = false">Cancel</button>
                <button class="btn btn-danger" @click="confirmLeave">Leave Team</button>
            </div>
        </div>
    </div>

    <!-- Custom Screen Picker -->
    <Transition name="fade">
        <ScreenPicker 
            v-if="showScreenPicker"
            @close="showScreenPicker = false"
            @select="(id: string) => { showScreenPicker = false; store.shareScreen(id); }"
        />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useTeamsStore } from '../stores/teams';
import { useActivityStore } from '../stores/activity';
import { useRouter } from 'vue-router';

const store = useTeamsStore();
const activityStore = useActivityStore();
const router = useRouter();

// UI State
const currentTab = ref<'chat' | 'people' | 'goals'>('chat');
const isTheaterMode = ref(false);
const showGoalModal = ref(false);
const showDeviceSettings = ref(false);
const showLeaveModal = ref(false);
const showScreenPicker = ref(false);
const chatMsg = ref("");
const chatBox = ref<HTMLElement | null>(null);
const detachedChatBox = ref<HTMLElement | null>(null);

// Floating Chat State
const isChatDetached = ref(false);
const chatPos = ref({ x: 100, y: 100 });
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

// Lobby State
const tempName = ref(store.myProfile.name);
const joinId = ref("");
const googleAccount = ref<any>(null);

// Logic State
const goalApp = ref("");
const goalMinutes = ref(30);

// Video Layout Logic
const featuredPeerId = ref<string | null>(null);

const isFeaturedSharing = computed(() => {
    if (!featuredPeerId.value) return false;
    if (featuredPeerId.value === store.myProfile.id) return store.isScreenSharing;
    const m = store.members.find(x => x.id === featuredPeerId.value);
    return m?.isScreenSharing || false;
});

const featuredStream = computed(() => {
    if (!featuredPeerId.value) return null;
    if (featuredPeerId.value === store.myProfile.id) return store.localStream;
    return store.remoteStreams.get(featuredPeerId.value);
});

const featuredName = computed(() => getMemberName(featuredPeerId.value || ""));

const isMuted = computed(() => store.isMuted);
const isCameraOn = computed(() => store.isCameraOn);
const isScreenSharing = computed(() => store.isScreenSharing);

// Live Tracking Computeds
const isTrackingGoal = computed(() => {
    if (!store.activeGoal || store.activeGoal.status !== 'active') return false;
    return activityStore.currentActivity?.app_name?.toLowerCase().includes(store.activeGoal.appName.toLowerCase()) || false;
});

// --- Helpers ---
function getMemberName(id: string) {
    if (id === store.myProfile.id) return "You";
    return store.members.find(m => m.id === id)?.name || "Unknown";
}

function setFeatured(id: string) {
    featuredPeerId.value = featuredPeerId.value === id ? null : id;
}

function toggleTheater() {
    isTheaterMode.value = !isTheaterMode.value;
}

// --- Device Settings ---
async function openDeviceSettings() {
    try {
        await store.loadDevices();
    } catch (e) {
        console.error("Failed to load devices", e);
    }
    showDeviceSettings.value = true;
}

// --- Leave Team ---
async function confirmLeave() {
    showLeaveModal.value = false;
    await store.leaveVoice();
    store.leaveTeam();
    router.push('/');
    window.location.reload();
}

// --- Floating Chat Logic ---
function detachChat() {
    isChatDetached.value = true;
    chatPos.value = { x: window.innerWidth - 320, y: 100 }; // Default pos
    // Auto-theater maybe? 
    // isTheaterMode.value = true; 
}

function attachChat() {
    isChatDetached.value = false;
    currentTab.value = 'chat';
}

function startDrag(e: MouseEvent) {
    isDragging.value = true;
    dragOffset.value = { x: e.clientX - chatPos.value.x, y: e.clientY - chatPos.value.y };
}

function onDrag(e: MouseEvent) {
    if (!isDragging.value) return;
    chatPos.value = { x: e.clientX - dragOffset.value.x, y: e.clientY - dragOffset.value.y };
}

function stopDrag() {
    isDragging.value = false;
}

// --- Watchers ---
watch(() => store.members.map(m => ({ id: m.id, s: m.isScreenSharing })), (newVal, oldVal) => {
    const fresh = newVal.find(n => n.s && (!oldVal || !oldVal.find(o => o.id === n.id)?.s));
    if (fresh) {
        featuredPeerId.value = fresh.id;
        isTheaterMode.value = true; 
    }
}, { deep: true });

watch(() => store.messages.length, () => {
    nextTick(() => {
        if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight;
        if (detachedChatBox.value) detachedChatBox.value.scrollTop = detachedChatBox.value.scrollHeight;
    });
});

// --- Actions ---

async function createTeam() {
    await store.createTeam();
}

const isJoining = ref(false);
const joinError = ref("");

async function joinTeam() {
    if (!joinId.value) return;
    isJoining.value = true;
    joinError.value = "";
    
    // Attempt join
    await store.joinTeam(joinId.value);
    
    // Wait for connection or timeout
    // store.isConnected updates reactively when connection opens
    setTimeout(() => {
        if (!store.isConnected && isJoining.value) {
            isJoining.value = false;
            joinError.value = "Connection timed out. Check ID or try again.";
            store.leaveTeam(); // Cleanup pending
        }
    }, 8000);
}

// Watch for success
watch(() => store.isConnected, (connected) => {
    if (connected) isJoining.value = false;
});



function sendChat() {
    if (!chatMsg.value.trim()) return;
    store.sendMessage(chatMsg.value);
    chatMsg.value = "";
}

function logout() {
    if(!confirm("Logout?")) return;
    store.saveProfile("", "");
    window.location.reload();
}

function saveProfile() {
    store.saveProfile(tempName.value, store.myProfile.email);
}

function copyId() {
    navigator.clipboard.writeText(store.myProfile.id);
}

function createGoal() {
    store.setGoal(goalApp.value, goalMinutes.value * 60);
    showGoalModal.value = false;
}

function kickMember(id: string) {
    store.kickMember(id);
}

// Google Auth
async function startGoogleAuth() {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("login_google");
    const i = setInterval(async () => {
        const accs: any = await invoke("get_cloud_accounts");
        if(accs && accs.length) {
            googleAccount.value = accs[0];
            tempName.value = accs[0].name;
            store.saveProfile(accs[0].name, accs[0].email);
            clearInterval(i);
        }
    }, 2000);
}

function loginWithGoogle() {
    if(googleAccount.value) store.saveProfile(googleAccount.value.name, googleAccount.value.email);
}

// Tracking
let trackInt = 0;
onMounted(async () => {
   const { invoke } = await import("@tauri-apps/api/core");
   const accs: any = await invoke("get_cloud_accounts");
   if(accs && accs.length) googleAccount.value = accs[0];

   trackInt = window.setInterval(async () => {
       if(store.isConnected) {
           await activityStore.fetchCurrentActivity();
           const app = activityStore.currentActivity?.app_name || "Idle";
           store.sendActivity(app);
           if(store.activeGoal && store.activeGoal.status === 'active' && app.toLowerCase().includes(store.activeGoal.appName.toLowerCase())) {
               await activityStore.fetchTodayData();
               const t = activityStore.topApps.find(x => x.app_name.toLowerCase().includes(store.activeGoal!.appName.toLowerCase()))?.total_seconds || 0;
               store.sendProgress(t, app);
           }
       }
   }, 5000);
});

onUnmounted(() => clearInterval(trackInt));

</script>

<style scoped>
/* RESET & LAYOUT */
.teams-page {
    width: 100vw;
    height: 100vh;
    background: #0f0f13; /* Deep dark background */
    color: #fff;
    font-family: 'Inter', sans-serif;
    overflow: hidden;
    position: relative;
}

/* 1. FULLSCREEN LAYERS */
.fullscreen-layer {
    position: absolute;
    inset: 0;
    z-index: 100;
    background: radial-gradient(circle at center, #1a1a24 0%, #000 100%);
    display: flex;
    align-items: center;
    justify-content: center;
}
.center-content { width: 100%; max-width: 480px; padding: 20px; }
.glass-panel {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 32px;
    box-shadow: 0 24px 48px rgba(0,0,0,0.5);
}
.glass-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 20px;
    transition: all 0.2s;
}
.glass-card:hover { background: rgba(255,255,255,0.08); transform: translateY(-2px); }

/* Setup Panel */
.setup-panel { text-align: center; }
.panel-icon { font-size: 3rem; margin-bottom: 16px; }
h1 { font-size: 2rem; margin-bottom: 8px; font-weight: 700; letter-spacing: -1px; }
.subtitle { color: #888; margin-bottom: 32px; }

/* Buttons */
.btn { padding: 12px 24px; border-radius: 12px; border: none; font-weight: 600; cursor: pointer; font-size: 1rem; transition: all 0.2s; }
.btn-primary { background: #6366f1; color: white; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
.btn-primary:hover { background: #4f46e5; transform: scale(1.02); }
.btn-accent { background: #06b6d4; color: white; }
.btn-google { background: white; color: black; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; }
.full { width: 100%; }

/* Lobby - Full Screen Centered Layout */
.lobby-fullscreen {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    background: radial-gradient(ellipse at center, #1a1a28 0%, #0a0a0f 100%);
}

.lobby-header {
    position: absolute;
    top: 24px;
    right: 32px;
    z-index: 10;
}

.user-badge {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 50px;
}

.avatar-small {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1rem;
    color: white;
}

.user-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.user-name {
    font-weight: 600;
    font-size: 0.95rem;
    color: white;
}

.btn-text-sm {
    background: none;
    border: none;
    font-size: 0.75rem;
    cursor: pointer;
    padding: 0;
    text-align: left;
    transition: opacity 0.2s;
}

.btn-text-sm.danger {
    color: #f87171;
}

.btn-text-sm:hover {
    opacity: 0.7;
}

.lobby-center {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.lobby-wrapper {
    width: 100%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    gap: 32px;
}

.lobby-title {
    text-align: center;
}

.lobby-title h2 {
    font-size: 1.8rem;
    font-weight: 700;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
}

.lobby-options { 
    display: flex; 
    flex-direction: column; 
    gap: 20px; 
}

.or-divider { 
    text-align: center; 
    color: #555; 
    font-size: 0.75rem; 
    letter-spacing: 3px; 
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 16px;
}

.or-divider::before,
.or-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.1);
}

.option-card { 
    text-align: center;
    padding: 28px 24px;
}

.option-card h3 {
    font-size: 1.2rem;
    margin-bottom: 6px;
}

.card-desc {
    font-size: 0.85rem;
    color: #888;
    margin-bottom: 16px;
}

.card-icon { 
    font-size: 2.5rem; 
    margin-bottom: 16px;
}

.primary-glow {
    border-color: rgba(99,102,241,0.3);
    box-shadow: 0 0 30px rgba(99,102,241,0.15);
}

.input-group { 
    display: flex; 
    gap: 10px; 
    margin-top: 16px; 
}

.input-group input { 
    flex: 1; 
    padding: 14px 16px; 
    border-radius: 12px; 
    border: 1px solid rgba(255,255,255,0.1); 
    background: rgba(0,0,0,0.4); 
    color: white;
    font-size: 0.95rem;
    transition: all 0.2s;
}

.input-group input:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
}

/* 2. MAIN INTERFACE */
.main-interface { display: flex; width: 100%; height: 100%; }

/* Stage Area (Left) */
.stage-area { flex: 1; display: flex; flex-direction: column; position: relative; background: #000; }
.video-stage { flex: 1; position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; }

/* Grid View - Smart Auto Fit */
.grid-view {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    align-content: center;
    gap: 16px;
    padding: 24px;
    padding-bottom: 90px; /* Space for control bar */
    width: 100%;
    height: 100%;
    overflow-y: auto; /* Fallback */
}

/* Strip Row (when someone is featured) */
.grid-view.strip-row {
    height: auto;
    max-height: 180px;
    flex: 0 0 auto;
    background: #111;
    padding: 12px;
    gap: 12px;
    flex-wrap: nowrap;
    overflow-x: auto;
    justify-content: flex-start;
    border-top: 1px solid #222;
    padding-bottom: 12px;
    align-content: center;
}
.grid-view.strip-row .video-item { width: 180px; height: 120px; min-width: 180px; flex-grow: 0; }

/* Dynamic Video Items */
.video-item {
    flex: 1 1 320px;
    max-width: 48%;
    aspect-ratio: 16/9;
    height: auto;
    background: #1a1a20;
    border-radius: 24px;
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 12px 32px rgba(0,0,0,0.5);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.video-item:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    border-color: rgba(99,102,241,0.4);
}

/* Adjust for single view */
.grid-view.single-view .video-item { 
    max-width: 100%; 
    max-height: 100%; 
    width: auto; 
    height: auto; 
    aspect-ratio: auto; 
    border-radius: 0;
    border: none;
}

/* 3+ items -> 33% width */
.grid-view:has(.video-item:nth-last-child(n+3)) .video-item { max-width: 45%; }
.grid-view:has(.video-item:nth-last-child(n+5)) .video-item { max-width: 30%; }

.video-item video { width: 100%; height: 100%; object-fit: cover; }
.video-item.local video { transform: scaleX(-1); }

.peer-name {
    position: absolute;
    bottom: 16px; left: 16px;
    background: rgba(15, 15, 20, 0.75);
    padding: 6px 14px;
    border-radius: 30px;
    font-size: 0.85rem;
    font-weight: 600;
    color: white;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.1);
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

/* Featured View (Screen Share) */
.featured-view {
    flex: 1;
    width: 100%;
    position: relative;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    /* Premium background effect for screen share */
    background: radial-gradient(circle at center, #1e1e2d 0%, #000 100%);
}

.featured-video { 
    width: 100%; 
    height: 100%; 
    object-fit: contain; 
    transition: transform 0.3s ease;
}

.featured-label { 
    position: absolute; 
    top: 24px; 
    left: 24px; 
    font-size: 1rem; 
    font-weight: 600;
    background: rgba(15, 15, 20, 0.85); 
    padding: 10px 20px; 
    border-radius: 50px; 
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.1);
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    z-index: 10;
}

.btn-close-feature { 
    position: absolute; 
    top: 24px; 
    right: 24px; 
    background: rgba(239, 68, 68, 0.2); 
    border: 1px solid rgba(239, 68, 68, 0.3); 
    color: #fca5a5; 
    padding: 10px 20px; 
    border-radius: 50px; 
    cursor: pointer; 
    font-weight: 600;
    font-size: 0.9rem;
    backdrop-filter: blur(16px);
    transition: all 0.2s;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 6px;
}

.btn-close-feature:hover {
    background: rgba(239, 68, 68, 0.9);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);
}

/* Controls Floating - Centered and lifted */
.control-bar-wrapper {
    position: absolute;
    bottom: 24px;
    left: 0; right: 0;
    display: flex;
    justify-content: center;
    pointer-events: none;
    z-index: 50;
}
/* Control Bar */
.control-bar {
    pointer-events: auto;
    position: absolute;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 15, 19, 0.85);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 50px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 50;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    max-width: 90%;
    overflow-x: auto;
}

/* Hide scrollbar for control bar if it overflows on very small screens */
.control-bar::-webkit-scrollbar {
    display: none;
}

.controls-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.ctrl-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    transition: all 0.2s;
    flex-shrink: 0;
}

.ctrl-btn:hover {
    background: rgba(255,255,255,0.1);
    transform: translateY(-2px);
}

.ctrl-btn.active {
    background: #6366f1;
    color: white;
    box-shadow: 0 4px 12px rgba(99,102,241,0.4);
}

.ctrl-btn.off {
    background: rgba(255,59,48,0.1);
    color: #ff3b30;
}

.ctrl-btn.danger {
    color: #ff3b30;
}

.ctrl-btn.danger:hover {
    background: #ff3b30;
    color: white;
}

.sep {
    width: 1px;
    height: 24px;
    background: rgba(255,255,255,0.1);
    margin: 0 4px;
}


/* Sidebar Area (Right) */
.sidebar-area { width: 360px; background: #131318; border-left: 1px solid #222; display: flex; flex-direction: column; flex-shrink: 0; }
.tabs-header { display: flex; border-bottom: 1px solid #222; background: #0f0f13; }
.tab-btn { flex: 1; padding: 16px; background: transparent; border: none; color: #666; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
.tab-btn:hover { color: white; background: rgba(255,255,255,0.02); }
.tab-btn.active { color: #6366f1; border-bottom-color: #6366f1; background: rgba(99,102,241,0.05); }

.tab-content { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
.tab-pane { padding: 20px; flex: 1; display: flex; flex-direction: column; }

/* Chat Pane */
.chat-container-inner { display: flex; flex-direction: column; height: 100%; }
.chat-header-actions { display: flex; justify-content: space-between; margin-bottom: 8px; color: #888; }
.msg-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-bottom: 12px; }
.sys-msg { text-align: center; color: #444; font-size: 0.8rem; margin: 12px 0; }
.msg-row { display: flex; flex-direction: column; align-items: flex-start; max-width: 85%; }
.msg-row.mine { align-self: flex-end; align-items: flex-end; }
.msg-bubble { background: #222; padding: 8px 12px; border-radius: 12px; border-top-left-radius: 2px; color: #ddd; font-size: 0.95rem; line-height: 1.4; }
.msg-row.mine .msg-bubble { background: #6366f1; color: white; border-radius: 12px; border-top-right-radius: 2px; }
.msg-meta { font-size: 0.7rem; color: #666; margin-bottom: 2px; margin-left: 4px; }
.chat-input-area { display: flex; gap: 8px; margin-top: auto; }
.chat-input-area input { flex: 1; background: #222; border: 1px solid #333; padding: 10px; border-radius: 8px; color: white; }

/* Floating Chat */
.floating-chat { position: fixed; width: 300px; height: 400px; z-index: 200; display: flex; flex-direction: column; padding: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.1); }
.float-header { cursor: move; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; margin-bottom: 8px; color: #fff; font-weight: bold; }
.btn-close-sm { background: none; border: none; color: #666; cursor: pointer; font-size: 1.2rem; }
.detached-placeholder { text-align: center; color: #666; margin-top: 40px; }

/* People Pane */
.member-card { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 8px; transition: 0.2s; cursor: default; }
.member-card:hover { background: rgba(255,255,255,0.03); }
.m-avatar { width: 36px; height: 36px; border-radius: 50%; background: #333; display: flex; align-items: center; justify-content: center; font-weight: bold; }
.m-avatar.voice { border: 2px solid #10b981; color: #10b981; }
.m-info { flex: 1; }
.m-name { font-weight: 600; font-size: 0.9rem; }
.m-status { font-size: 0.75rem; color: #666; }
.invite-box { margin-top: auto; background: #1a1a20; padding: 12px; border-radius: 8px; }
.copy-row { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; font-family: monospace; background: black; padding: 8px; border-radius: 4px; cursor: pointer; }

/* Goals Pane */
.goal-active-card { background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(100,200,250,0.05)); border: 1px solid rgba(99,102,241,0.2); }
.goal-head { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.g-icon { font-size: 1.5rem; }
.tracking-status { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #666; margin-bottom: 10px; padding: 4px 8px; background: rgba(0,0,0,0.2); border-radius: 4px; width: fit-content; }
.tracking-status.active { color: #10b981; background: rgba(16,185,129,0.1); }
.dot { width: 6px; height: 6px; border-radius: 50%; background: #666; }
.tracking-status.active .dot { background: #10b981; box-shadow: 0 0 5px #10b981; }

.admin-btns { display: flex; gap: 8px; margin-top: 8px; }
.btn-xs { font-size: 0.7rem; padding: 4px 8px; border-radius: 4px; border: none; cursor: pointer; color: white; }
.btn-xs.success { background: #10b981; }
.btn-xs.danger { background: #f43f5e; }

.progress-list { margin-top: 24px; display: flex; flex-direction: column; gap: 12px; }
.p-head { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px; color: #888; }
.p-track { height: 6px; background: #222; border-radius: 3px; overflow: hidden; }
.p-fill { height: 100%; background: #6366f1; }

.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 200; display: flex; align-items: center; justify-content: center; }
.modal { width: 400px; }
.input-std { width: 100%; padding: 12px; background: #222; border: 1px solid #333; color: white; border-radius: 8px; margin: 12px 0; }
.time-opts { display: flex; gap: 8px; margin-bottom: 24px; }
.time-opts button { flex: 1; padding: 10px; background: #222; border: 1px solid #333; color: #888; border-radius: 8px; cursor: pointer; }
.time-opts button.selected { background: #6366f1; color: white; border-color: #6366f1; }

.error-msg { color: #f43f5e; font-size: 0.85rem; margin-top: 8px; }

/* Premium A/V Settings Modal */
.av-settings-modal {
    width: 420px;
    max-width: 90%;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
}

.modal-title {
    display: flex;
    align-items: center;
    gap: 12px;
}

.modal-title h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
}

.modal-icon {
    font-size: 1.5rem;
}

.btn-close-modal {
    background: rgba(255,255,255,0.1);
    border: none;
    color: #888;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
}

.btn-close-modal:hover {
    background: rgba(255,255,255,0.15);
    color: white;
}

.modal-body {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.setting-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.setting-label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.9rem;
    font-weight: 500;
    color: #aaa;
}

.setting-label svg {
    opacity: 0.7;
}

.custom-select-wrapper {
    position: relative;
}

.styled-select {
    width: 100%;
    padding: 14px 40px 14px 16px;
    background: rgba(0,0,0,0.4);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    color: white;
    font-size: 0.95rem;
    appearance: none;
    cursor: pointer;
    transition: all 0.2s;
}

.styled-select:hover {
    border-color: rgba(255,255,255,0.2);
}

.styled-select:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
}

.select-arrow {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    pointer-events: none;
    font-size: 0.8rem;
}

.modal-footer {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid rgba(255,255,255,0.1);
}

/* Control Bar Button Improvements */
.ctrl-btn svg {
    width: 22px;
    height: 22px;
    stroke: currentColor;
    fill: none;
}

</style>
