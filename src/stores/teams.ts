import { defineStore } from "pinia";
import { ref, reactive, computed } from "vue";
import Peer, { type DataConnection, type MediaConnection } from "peerjs";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

export interface TeamMember {
  id: string; // Peer ID
  name: string;
  email: string; // Optional, can be empty
  isLeader: boolean;
  status: 'online' | 'offline' | 'busy' | 'voice';
  isScreenSharing?: boolean;
  currentApp?: string;
  progress?: {
    appName: string;
    current: number; // seconds
    target: number; // seconds
    percentage: number;
  };
  // Team page specific fields
  joinedAt: number; // timestamp when joined
  totalOnlineSeconds: number; // cumulative online time
  activityHistory: ActivityEntry[]; // history of app usage
  lastSeen: number; // last activity timestamp
}

export interface ActivityEntry {
  id: string;
  appName: string;
  windowTitle: string;
  category: string; // Work, Game, Rest, Programs, Uncategorized
  startTime: number;
  endTime: number;
  durationSeconds: number;
}

export interface MemberStats {
  memberId: string;
  memberName: string;
  totalOnlineSeconds: number;
  topApps: AppUsageEntry[];
  categoryBreakdown: CategoryBreakdown[];
  activeDuration: number; // time since joining
}

export interface AppUsageEntry {
  appName: string;
  totalSeconds: number;
  percentage: number;
}

export interface CategoryBreakdown {
  category: string;
  totalSeconds: number;
  percentage: number;
  color: string;
}

export interface TeamReport {
  groupName: string;
  groupCode: string;
  leaderId: string;
  createdAt: number;
  generatedAt: number;
  members: TeamMemberReport[];
}

export interface TeamMemberReport {
  memberId: string;
  memberName: string;
  isLeader: boolean;
  totalOnlineSeconds: number;
  activityHistory: ActivityEntry[];
  stats: MemberStats;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface TeamGoal {
  appName: string; // e.g., "Visual Studio Code" or "figma.com"
  targetSeconds: number;
  description: string;
  status?: 'active' | 'completed' | 'failed' | 'cancelled';
}

export const useTeamsStore = defineStore("teams", () => {
  // Identity
  const myProfile = reactive({
    name: "", // Will be set by ensureProfile() to PC computer name
    email: localStorage.getItem("timigs_team_email") || "",
    id: "", // Assigned by PeerJS
  });

  // State
  const peer = ref<Peer | null>(null);
  const connections = ref<DataConnection[]>([]); // For Leader: all members. For Member: just Leader.
  const isLeader = ref(false);
  const currentTeamId = ref<string>(""); // Leader's Peer ID

  // Group code system (for Team page)
  const groupName = ref<string>("");
  const groupCode = ref<string>(""); // 6-char short code for joining
  const groupLeaderPeerId = ref<string>(""); // The peer ID of the group leader

  const members = ref<TeamMember[]>([]);
  const messages = ref<ChatMessage[]>([]);
  const activeGoal = ref<TeamGoal | null>(null);
  
  // Voice State
  const localStream = ref<MediaStream | null>(null);
  const voiceConnections = ref<MediaConnection[]>([]);
  const voiceActive = ref(false);
  const remoteStreams = ref<Map<string, MediaStream>>(new Map());
  
  // Voice Controls
  const isMuted = ref(false);
  const isCameraOn = ref(false);
  const isScreenSharing = ref(false);
  
  // Device Management
  const audioInputDevices = ref<MediaDeviceInfo[]>([]);
  const audioOutputDevices = ref<MediaDeviceInfo[]>([]);
  const videoInputDevices = ref<MediaDeviceInfo[]>([]);
  const selectedAudioInput = ref<string>("");
  const selectedAudioOutput = ref<string>("");

  // Computed
  const isConnected = computed(() => !!peer.value && !peer.value.disconnected);
  // const amILeader = computed(() => isLeader.value);
  
  // Actions
  function saveProfile(name: string, email: string) {
    myProfile.name = name;
    myProfile.email = email;
    localStorage.setItem("timigs_team_name", name);
    localStorage.setItem("timigs_team_email", email);
  }

  async function ensureProfile() {
    try {
      const computerName = await invoke<string>("get_computer_name");
      if (computerName && computerName !== 'User') {
        myProfile.name = computerName;
        localStorage.setItem("timigs_team_name", computerName);
      } else if (!myProfile.name) {
        myProfile.name = "User";
      }
    } catch (e) {
      console.error("Failed to get computer name:", e);
      if (!myProfile.name) myProfile.name = "User";
    }
    return myProfile.name;
  }

  function initializePeer() {
    return new Promise<string>((resolve, reject) => {
      if (peer.value) {
        resolve(peer.value.id);
        return;
      }

      // Create Peer with random ID
      const newPeer = new Peer();

      newPeer.on('open', (id) => {
        myProfile.id = id;
        peer.value = newPeer;
        console.log("My Peer ID:", id);
        
        // Setup listener for incoming connections (Host logic mostly)
        newPeer.on('connection', handleIncomingConnection);
        
        // Setup listener for incoming voice calls
        newPeer.on('call', handleIncomingCall);

        resolve(id);
      });

      newPeer.on('error', (err) => {
        console.error("Peer Error:", err);
        reject(err);
      });
    });
  }

  function handleIncomingConnection(conn: DataConnection) {
    conn.on('open', () => {
      console.log("New connection from:", conn.peer);
      connections.value.push(conn);
      
      // Request their info
      conn.send({ type: 'REQUEST_PROFILE' });
      
      if (isLeader.value) {
        broadcastState();
      }
    });
    
    conn.on('data', (data: any) => handleData(data, conn));

    conn.on('close', () => {
      members.value = members.value.filter(m => m.id !== conn.peer);
      connections.value = connections.value.filter(c => c.peer !== conn.peer);
      broadcastState();
    });
  }

  // --- Voice/Video Logic ---
  async function joinVoice(video = false) {
    if (voiceActive.value) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: true, 
            video: video ? { width: 1280, height: 720 } : false 
        });
        localStream.value = stream;
        voiceActive.value = true;
        
        // Update status
        updateMyStatus('voice');

        // Call everyone
        if (isLeader.value) {
            connections.value.forEach(conn => callPeer(conn.peer, stream));
        } else {
             callPeer(currentTeamId.value, stream);
        }
    } catch (e) {
        console.error("Voice Error:", e);
    }
  }

  async function toggleCamera() {
      if (!localStream.value) {
          await joinVoice(true);
          return;
      }
      
      const videoTrack = localStream.value.getVideoTracks()[0];
      if (videoTrack) {
          // Toggle existing
          videoTrack.enabled = !videoTrack.enabled;
          // If we stopped it, maybe we want to actually stop the track to turn off light?
          // videoTrack.stop(); // But then we need to re-request. `enabled = false` is mute.
          // To truly "Turn On" if we started with audio-only:
      } else {
          // We started with audio-only, now want video
          try {
              const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
              const newTrack = videoStream.getVideoTracks()[0];
              localStream.value.addTrack(newTrack);
              
              // Replace track in active calls
              voiceConnections.value.forEach(call => {
                  const sender = call.peerConnection.getSenders().find(s => s.track?.kind === 'video');
                  if (sender) sender.replaceTrack(newTrack);
                  else call.peerConnection.addTrack(newTrack, localStream.value!);
              });
          } catch(e) { 
              console.error("Cam Error", e);
          }
      }
  }

  // --- Screen Share ---
  const desktopSources = ref<{ id: string, name: string, thumbnail: string }[]>([]);

  async function fetchDesktopSources() {
      try {
          const { invoke } = await import("@tauri-apps/api/core");
          desktopSources.value = await invoke("get_desktop_sources");
      } catch (e) {
          console.error("Failed to fetch desktop sources", e);
          desktopSources.value = [];
      }
  }

  async function shareScreen(sourceId?: string) {
      if (!localStream.value) await joinVoice(false);
      
      try {
          let screenStream: MediaStream;
          
          if (sourceId) {
             // Custom source selected
             // Note: In WebView2/Tauri, the ID format from EnumWindows (HWND) typically needs to be passed 
             // in a specific way or we might need to use getDisplayMedia which ignores sourceId usually.
             // Try standard legacy constraint for specific window:
             screenStream = await navigator.mediaDevices.getUserMedia({
                 audio: false,
                 video: {
                     // @ts-ignore
                     mandatory: {
                         chromeMediaSource: 'desktop',
                         chromeMediaSourceId: sourceId
                     }
                 }
             });
          } else {
             // Fallback to system picker
             // @ts-ignore
             screenStream = await navigator.mediaDevices.getDisplayMedia({ 
                 video: true, 
                 audio: false 
             });
          }
          
          const screenTrack = screenStream.getVideoTracks()[0];
          
          screenTrack.onended = () => {
              stopScreenShare(); 
          };

          const videoTrack = localStream.value!.getVideoTracks()[0];
          if (videoTrack) {
              videoTrack.stop();
              localStream.value!.removeTrack(videoTrack);
          }
          localStream.value!.addTrack(screenTrack);
          
          voiceConnections.value.forEach(call => {
               const sender = call.peerConnection.getSenders().find(s => s.track?.kind === 'video');
               if (sender) sender.replaceTrack(screenTrack);
               else call.peerConnection.addTrack(screenTrack, localStream.value!);
          });
          
          isScreenSharing.value = true;
          updateMyStatus('voice', true);
          
      } catch (e) {
          console.error("Screen Share Error", e);
      }
  }
  
  function stopScreenShare() {
       if (localStream.value) {
          const videoTrack = localStream.value.getVideoTracks()[0];
          if (videoTrack) {
              videoTrack.stop();
              localStream.value.removeTrack(videoTrack);
          }
       }
       isScreenSharing.value = false;
       updateMyStatus('voice', false);
       
       // Optional: Try to restore camera here if needed
  }

  function toggleMute() {
      if (!localStream.value) return;
      const audioTrack = localStream.value.getAudioTracks()[0];
      if (audioTrack) {
          audioTrack.enabled = !audioTrack.enabled;
          isMuted.value = !audioTrack.enabled;
      }
  }

  async function loadDevices() {
      try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          audioInputDevices.value = devices.filter(d => d.kind === 'audioinput');
          audioOutputDevices.value = devices.filter(d => d.kind === 'audiooutput');
          videoInputDevices.value = devices.filter(d => d.kind === 'videoinput');
          
          // Set defaults if not set
          if (!selectedAudioInput.value && audioInputDevices.value.length) {
              selectedAudioInput.value = audioInputDevices.value[0].deviceId;
          }
          if (!selectedAudioOutput.value && audioOutputDevices.value.length) {
              selectedAudioOutput.value = audioOutputDevices.value[0].deviceId;
          }
      } catch (e) {
          console.error("Device Enum Error", e);
      }
  }

  async function switchAudioInput(deviceId: string) {
      selectedAudioInput.value = deviceId;
      if (!localStream.value || !voiceActive.value) return;
      
      try {
          const newStream = await navigator.mediaDevices.getUserMedia({
              audio: { deviceId: { exact: deviceId } }
          });
          const newTrack = newStream.getAudioTracks()[0];
          const oldTrack = localStream.value.getAudioTracks()[0];
          
          if (oldTrack) {
              oldTrack.stop();
              localStream.value.removeTrack(oldTrack);
          }
          localStream.value.addTrack(newTrack);
          
          // Update in active calls
          voiceConnections.value.forEach(call => {
              const sender = call.peerConnection.getSenders().find(s => s.track?.kind === 'audio');
              if (sender) sender.replaceTrack(newTrack);
          });
      } catch (e) {
          console.error("Switch Audio Error", e);
      }
  }

  function leaveVoice() {
      if (localStream.value) {
          localStream.value.getTracks().forEach(track => track.stop());
          localStream.value = null;
      }
      voiceConnections.value.forEach(call => call.close());
      voiceConnections.value = [];
      remoteStreams.value.clear();
      voiceActive.value = false;
      isMuted.value = false;
      isCameraOn.value = false;
      isScreenSharing.value = false;
      updateMyStatus('online', false);
  }
  
  function callPeer(peerId: string, stream: MediaStream) {
     if (!peer.value) return;
     const call = peer.value.call(peerId, stream);
     setupCallEvents(call);
  }

  function handleIncomingCall(call: MediaConnection) {
      if (voiceActive.value && localStream.value) {
          call.answer(localStream.value);
          setupCallEvents(call);
      } else {
          // Auto-join voice audio-only
          navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
              localStream.value = stream;
              voiceActive.value = true;
              call.answer(stream);
              setupCallEvents(call);
          }).catch(e => {
               console.error("Could not auto-answer", e);
               call.close();
          });
      }
  }

  function setupCallEvents(call: MediaConnection) {
      call.on('stream', (remoteStream) => {
          console.log("Got remote stream from", call.peer);
          remoteStreams.value.set(call.peer, remoteStream);
      });
      call.on('close', () => {
          remoteStreams.value.delete(call.peer);
      });
      call.on('error', (e) => console.error("Call error", e));
      voiceConnections.value.push(call);
  }
  
  function updateMyStatus(status: 'online' | 'voice', sharing?: boolean) {
      const self = members.value.find(m => m.id === myProfile.id);
      if (self) {
          self.status = status;
          if (typeof sharing === 'boolean') {
              self.isScreenSharing = sharing;
          }
      }
      
      const payload = { 
          id: myProfile.id, 
          status, 
          isScreenSharing: typeof sharing === 'boolean' ? sharing : self?.isScreenSharing 
      };
      
      if (isLeader.value) broadcast({ type: 'STATUS_UPDATE', payload });
      else connections.value.forEach(c => c.send({ type: 'STATUS_UPDATE', payload }));
  }


  async function handleData(data: any, conn: DataConnection) {
    switch (data.type) {
      case 'REQUEST_PROFILE':
        // Send my profile back
        conn.send({ 
          type: 'PROFILE_RESPONSE', 
          payload: { name: myProfile.name, email: myProfile.email, isLeader: isLeader.value } 
        });
        break;

      case 'PROFILE_RESPONSE':
        // A new member sent their details
        handleProfileResponse(data.payload, conn);
        break;

      case 'SYNC_STATE':
        // Received full state update (usually from Leader)
        if (!isLeader.value) {
          members.value = data.payload.members;
          activeGoal.value = data.payload.goal;
        }
        break;
        
      case 'STATUS_UPDATE':
         // Update member status
         const m = members.value.find(mem => mem.id === data.payload.id);
         if (m) {
             m.status = data.payload.status;
             if (data.payload.isScreenSharing !== undefined) {
                 m.isScreenSharing = data.payload.isScreenSharing;
             }
         }
         if (isLeader.value) broadcast(data, conn.peer);
         break;

      case 'CHAT_MESSAGE':
        messages.value.push(data.payload);
        if (isLeader.value) {
          // Re-broadcast to everyone else
           broadcast({ type: 'CHAT_MESSAGE', payload: data.payload }, conn.peer);
        }
        break;
        
      case 'PROGRESS_UPDATE':
        // Member sending progress to Leader
        if (isLeader.value) {
          updateMemberProgress(conn.peer, data.payload);
          broadcastState(); // Reflect change to everyone
        }
        break;

      case 'ACTIVITY_UPDATE':
         if (isLeader.value) {
            updateMemberActivity(conn.peer, data.payload.appName);
            broadcastState();
         }
         break;

      case 'ACTIVITY_BROADCAST':
         handleActivityBroadcast(data.payload);
         break;

      case 'ACTIVITY_SESSION':
         handleActivitySession(data.payload);
         break;

      case 'SYSTEM_NOTIFICATION':
         // Received a forwarded notification from PC
         const notificationStore = (await import('./notifications')).useNotificationStore();
         notificationStore.add({
             title: data.payload.title,
             message: data.payload.body,
             type: data.payload.type || 'info',
             duration: 10000 // Mobile notification should stay a bit longer
         });
         break;

      case 'REPORT_DOWNLOADED':
         // Notify the target member (shown via UI notification)
         break;

      case 'KICK':
         // I was kicked
         leaveTeam();
         break;
    }
  }

  function handleProfileResponse(payload: any, conn: DataConnection) {
     const newMember: TeamMember = {
        id: conn.peer,
        name: payload.name,
        email: payload.email,
        isLeader: payload.isLeader,
        status: 'online',
        joinedAt: Date.now(),
        totalOnlineSeconds: 0,
        activityHistory: [],
        lastSeen: Date.now()
     };

     // Update or Add
     const index = members.value.findIndex(m => m.id === conn.peer);
     if (index !== -1) {
       members.value[index] = { ...members.value[index], ...newMember };
     } else {
       members.value.push(newMember);
     }

     if (isLeader.value) {
       broadcastState(); // Tell everyone about the new guy
     }
  }

  function updateMemberProgress(peerId: string, progress: any) {
    const member = members.value.find(m => m.id === peerId);
    if (member) {
      member.progress = progress;
    }
  }

  // --- Leader Actions ---

  async function createTeam() {
    await initializePeer();
    isLeader.value = true;
    currentTeamId.value = myProfile.id;
    // Add myself
    members.value = [{
      id: myProfile.id,
      name: myProfile.name,
      email: myProfile.email,
      isLeader: true,
      status: 'online',
      joinedAt: Date.now(),
      totalOnlineSeconds: 0,
      activityHistory: [],
      lastSeen: Date.now()
    }];
  }

  function setGoal(appName: string, targetSeconds: number) {
    activeGoal.value = { 
        appName, 
        targetSeconds, 
        description: `Work on ${appName} for ${Math.floor(targetSeconds/60)}m`,
        status: 'active'
    };
    broadcastState();
  }
  
  function updateGoalStatus(status: 'completed' | 'failed' | 'cancelled') {
      if (activeGoal.value) {
          activeGoal.value.status = status;
          broadcastState();
      }
  }

  function kickMember(memberId: string) {
      if (!isLeader.value) return;
      
      // Notify them
      const conn = connections.value.find(c => c.peer === memberId);
      if (conn) {
          conn.send({ type: 'KICK' });
          conn.close();
      }
      
      // Remove local
      members.value = members.value.filter(m => m.id !== memberId);
      broadcastState();
  }

  function broadcastState() {
    if (!isLeader.value) return;
    const state = {
      type: 'SYNC_STATE',
      payload: {
        members: members.value,
        goal: activeGoal.value,
      }
    };
    connections.value.forEach(conn => conn.send(state));
  }

  function broadcast(msg: any, excludeId?: string) {
    connections.value.forEach(conn => {
      if (conn.peer !== excludeId) conn.send(msg);
    });
  }

  // --- Member Actions ---

  async function joinTeam(leaderId: string) {
    await initializePeer();
    isLeader.value = false;
    currentTeamId.value = leaderId;
    members.value = []; // Clear current
    
    const conn = peer.value!.connect(leaderId);
    conn.on('open', () => {
      console.log("Connected to Leader");
      connections.value.push(conn);
    });
    conn.on('data', (d) => handleData(d, conn));
    conn.on('close', leaveTeam);
  }

  function leaveTeam() {
    leaveVoice(); // Ensure voice is closed
    connections.value.forEach(c => c.close());
    connections.value = [];
    isLeader.value = false;
    currentTeamId.value = "";
    members.value = [];
    activeGoal.value = null;
    messages.value = [];
  }

  function sendMessage(text: string) {
    const msg: ChatMessage = {
      id: Date.now().toString(),
      senderId: myProfile.id,
      senderName: myProfile.name,
      text,
      timestamp: Date.now()
    };
    messages.value.push(msg); // Add locally
    
    if (isLeader.value) {
      broadcast({ type: 'CHAT_MESSAGE', payload: msg });
    } else {
      // Send to leader, who broadcasts
      connections.value.forEach(c => c.send({ type: 'CHAT_MESSAGE', payload: msg }));
    }
  }

  function sendProgress(current: number, appName: string) {
    if (!activeGoal.value) return;
    
    const percentage = Math.min(100, Math.round((current / activeGoal.value.targetSeconds) * 100));
    const payload = {
       appName,
       current,
       target: activeGoal.value.targetSeconds,
       percentage
    };
    
    // Update local self
    const self = members.value.find(m => m.id === myProfile.id);
    if (self) self.progress = payload;

    if (isLeader.value) {
      broadcastState();
    } else {
      connections.value.forEach(c => c.send({ type: 'PROGRESS_UPDATE', payload }));
    }
  }

  function sendActivity(appName: string) {
      if (!isLeader.value) {
          connections.value.forEach(c => c.send({ type: 'ACTIVITY_UPDATE', payload: { appName } }));
      }
      // Update local
      updateMemberActivity(myProfile.id, appName);
      if (isLeader.value) broadcastState();
  }

  function updateMemberActivity(peerId: string, appName: string) {
      const m = members.value.find(x => x.id === peerId);
      if (m) m.currentApp = appName;
  }

  // =============================================
  // GROUP CODE SYSTEM (Team Page)
  // =============================================

  // In-memory registry: groupCode -> leaderPeerId (for demo; in production use a signaling server)
  const groupRegistry = new Map<string, string>();

  function generateGroupCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  function generateGroupName(base: string): string {
    if (base.trim()) return base.trim();
    const adjectives = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];
    const nouns = ['Team', 'Squad', 'Crew', 'Unit', 'Group', 'Force', 'Guild'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj} ${noun}`;
  }

  // Create a new group (leader)
  async function createGroup(name?: string): Promise<{ groupCode: string; groupName: string }> {
    await initializePeer();
    isLeader.value = true;
    currentTeamId.value = myProfile.id;
    groupLeaderPeerId.value = myProfile.id;

    const code = generateGroupCode();
    const gName = generateGroupName(name || '');

    groupCode.value = code;
    groupName.value = gName;

    // Register the code -> peer mapping
    groupRegistry.set(code, myProfile.id);

    // Add myself as first member
    members.value = [{
      id: myProfile.id,
      name: myProfile.name || 'Anonymous',
      email: myProfile.email,
      isLeader: true,
      status: 'online',
      joinedAt: Date.now(),
      totalOnlineSeconds: 0,
      activityHistory: [],
      lastSeen: Date.now()
    }];

    // Save to localStorage
    saveGroupState();

    return { groupCode: code, groupName: gName };
  }

  // Join a group by code (member)
  async function joinGroupByCode(code: string): Promise<boolean> {
    const leaderPeerId = groupRegistry.get(code.toUpperCase());
    if (!leaderPeerId) {
      return false; // Group not found
    }

    await initializePeer();
    isLeader.value = false;
    currentTeamId.value = leaderPeerId;
    groupLeaderPeerId.value = leaderPeerId;
    groupCode.value = code.toUpperCase();

    const conn = peer.value!.connect(leaderPeerId);
    conn.on('open', () => {
      console.log("Connected to Group Leader:", leaderPeerId);
      connections.value.push(conn);
    });
    conn.on('data', (d: any) => handleData(d, conn));
    conn.on('close', leaveGroup);

    saveGroupState();
    return true;
  }

  // Leave the current group
  function leaveGroup() {
    leaveVoice();
    connections.value.forEach(c => c.close());
    connections.value = [];
    isLeader.value = false;
    currentTeamId.value = "";
    groupCode.value = "";
    groupName.value = "";
    groupLeaderPeerId.value = "";
    members.value = [];
    activeGoal.value = null;
    messages.value = [];
    localStorage.removeItem('timigs_group_state');

    // If leader, unregister the code
    if (groupRegistry.has(groupCode.value)) {
      groupRegistry.delete(groupCode.value);
    }
  }

  // Save group state to localStorage
  function saveGroupState() {
    const state = {
      groupCode: groupCode.value,
      groupName: groupName.value,
      isLeader: isLeader.value,
      groupLeaderPeerId: groupLeaderPeerId.value,
      profileName: myProfile.name
    };
    localStorage.setItem('timigs_group_state', JSON.stringify(state));
  }

  // Restore group state from localStorage
  async function restoreGroupState(): Promise<boolean> {
    const saved = localStorage.getItem('timigs_group_state');
    if (!saved) return false;

    try {
      const state = JSON.parse(saved);
      if (!state.groupCode || !state.groupLeaderPeerId) return false;

      // Profile name is already set by ensureProfile() (uses PC name)

      if (state.isLeader) {
        // Re-create as leader
        await createGroup(state.groupName);
        // Re-register the code
        groupRegistry.set(groupCode.value, myProfile.id);
      } else {
        // Re-join as member
        groupCode.value = state.groupCode;
        groupName.value = state.groupName || 'Team Group';
        await joinGroupByCode(state.groupCode);
      }

      return true;
    } catch {
      return false;
    }
  }

  // =============================================
  // ACTIVITY SHARING
  // =============================================

  // Send current activity to all members
  function broadcastActivity(activity: { appName: string; windowTitle: string; category: string }) {
    const payload = {
      type: 'ACTIVITY_BROADCAST',
      payload: {
        memberId: myProfile.id,
        appName: activity.appName || 'Unknown',
        windowTitle: activity.windowTitle || '',
        category: activity.category || 'Uncategorized',
        timestamp: Date.now()
      }
    };

    // Update local
    updateMemberActivity(myProfile.id, activity.appName);
    const self = members.value.find(m => m.id === myProfile.id);
    if (self) {
      self.lastSeen = Date.now();
      self.currentApp = activity.appName;
    }

    if (isLeader.value) {
      broadcast(payload);
    } else {
      connections.value.forEach(c => c.send(payload));
    }
  }

  // Handle incoming activity broadcast
  function handleActivityBroadcast(payload: any) {
    const m = members.value.find(x => x.id === payload.memberId);
    if (m) {
      m.currentApp = payload.appName;
      m.lastSeen = payload.timestamp;

      // Add to activity history
      const entry: ActivityEntry = {
        id: `${payload.memberId}-${payload.timestamp}`,
        appName: payload.appName,
        windowTitle: payload.windowTitle,
        category: payload.category,
        startTime: payload.timestamp,
        endTime: payload.timestamp,
        durationSeconds: 0
      };
      m.activityHistory.push(entry);

      // Limit history size
      if (m.activityHistory.length > 200) {
        m.activityHistory = m.activityHistory.slice(-200);
      }
    }

    // Leader re-broadcasts to other members
    if (isLeader.value) {
      broadcast({ type: 'ACTIVITY_BROADCAST', payload });
    }
  }

  // Send activity session with duration
  function broadcastActivitySession(entry: ActivityEntry) {
    const payload = {
      type: 'ACTIVITY_SESSION',
      payload: {
        memberId: myProfile.id,
        entry
      }
    };

    const self = members.value.find(m => m.id === myProfile.id);
    if (self) {
      self.activityHistory.push(entry);
      self.totalOnlineSeconds += entry.durationSeconds;
    }

    if (isLeader.value) {
      broadcast(payload);
    } else {
      connections.value.forEach(c => c.send(payload));
    }
  }

  // Handle incoming activity session
  function handleActivitySession(payload: any) {
    const m = members.value.find(x => x.id === payload.memberId);
    if (m) {
      m.activityHistory.push(payload.entry);
      m.totalOnlineSeconds += payload.entry.durationSeconds;

      if (m.activityHistory.length > 200) {
        m.activityHistory = m.activityHistory.slice(-200);
      }
    }

    if (isLeader.value) {
      broadcast({ type: 'ACTIVITY_SESSION', payload });
    }
  }

  // =============================================
  // STATISTICS
  // =============================================

  // Get statistics for a specific member
  function getMemberStats(memberId: string): MemberStats | null {
    const member = members.value.find(m => m.id === memberId);
    if (!member) return null;

    const activeDuration = Date.now() - member.joinedAt;

    // Calculate top apps
    const appMap = new Map<string, number>();
    const categoryMap = new Map<string, number>();

    member.activityHistory.forEach(entry => {
      appMap.set(entry.appName, (appMap.get(entry.appName) || 0) + entry.durationSeconds);
      categoryMap.set(entry.category, (categoryMap.get(entry.category) || 0) + entry.durationSeconds);
    });

    const totalAppSeconds = Array.from(appMap.values()).reduce((a, b) => a + b, 0);
    const topApps: AppUsageEntry[] = Array.from(appMap.entries())
      .map(([appName, totalSeconds]) => ({
        appName,
        totalSeconds,
        percentage: totalAppSeconds > 0 ? Math.round((totalSeconds / totalAppSeconds) * 100) : 0
      }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds)
      .slice(0, 10);

    const totalCategorySeconds = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);
    const categoryColors: Record<string, string> = {
      'Work': '#5b6ee1',
      'Game': '#ef4444',
      'Rest': '#10b981',
      'Programs': '#8b5cf6',
      'Uncategorized': '#6b7280'
    };
    const categoryBreakdown: CategoryBreakdown[] = Array.from(categoryMap.entries())
      .map(([category, totalSeconds]) => ({
        category,
        totalSeconds,
        percentage: totalCategorySeconds > 0 ? Math.round((totalSeconds / totalCategorySeconds) * 100) : 0,
        color: categoryColors[category] || '#6b7280'
      }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds);

    return {
      memberId,
      memberName: member.name,
      totalOnlineSeconds: member.totalOnlineSeconds,
      topApps,
      categoryBreakdown,
      activeDuration
    };
  }

  // Get ranking of members by online time
  function getOnlineTimeRanking(): { memberId: string; memberName: string; totalOnlineSeconds: number; rank: number }[] {
    return members.value
      .map(m => ({
        memberId: m.id,
        memberName: m.name,
        totalOnlineSeconds: m.totalOnlineSeconds
      }))
      .sort((a, b) => b.totalOnlineSeconds - a.totalOnlineSeconds)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  // Get total team stats
  function getTeamStats() {
    const totalMembers = members.value.length;
    const onlineMembers = members.value.filter(m => m.status === 'online' || m.status === 'voice').length;
    const totalOnlineSeconds = members.value.reduce((sum, m) => sum + m.totalOnlineSeconds, 0);

    // Aggregate top apps across all members
    const appMap = new Map<string, number>();
    members.value.forEach(member => {
      member.activityHistory.forEach(entry => {
        appMap.set(entry.appName, (appMap.get(entry.appName) || 0) + entry.durationSeconds);
      });
    });

    const topApp = Array.from(appMap.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      totalMembers,
      onlineMembers,
      totalOnlineSeconds,
      topApp
    };
  }

  // =============================================
  // REPORT GENERATION & DOWNLOAD
  // =============================================

  // Generate report for entire group
  function generateGroupReport(): TeamReport {
    const memberReports: TeamMemberReport[] = members.value.map(member => ({
      memberId: member.id,
      memberName: member.name,
      isLeader: member.isLeader,
      totalOnlineSeconds: member.totalOnlineSeconds,
      activityHistory: member.activityHistory,
      stats: getMemberStats(member.id)!
    }));

    return {
      groupName: groupName.value,
      groupCode: groupCode.value,
      leaderId: groupLeaderPeerId.value,
      createdAt: members.value.find(m => m.isLeader)?.joinedAt || Date.now(),
      generatedAt: Date.now(),
      members: memberReports
    };
  }

  // Generate report for a specific member
  function generateMemberReport(memberId: string): TeamMemberReport | null {
    const member = members.value.find(m => m.id === memberId);
    if (!member) return null;

    return {
      memberId: member.id,
      memberName: member.name,
      isLeader: member.isLeader,
      totalOnlineSeconds: member.totalOnlineSeconds,
      activityHistory: member.activityHistory,
      stats: getMemberStats(member.id)!
    };
  }

  // Download report as JSON file
  async function downloadReport(report: TeamReport | TeamMemberReport, filename?: string) {
    try {
      const defaultName = 'memberId' in report ? `${report.memberName}_Report` : `${report.groupName}_Report`;
      const finalName = filename || `${defaultName}_${new Date().toISOString().split('T')[0]}.json`;
      
      const savePath = await save({
        defaultPath: finalName,
        filters: [{ name: 'JSON Document', extensions: ['json'] }]
      });

      if (savePath) {
        await writeTextFile(savePath, JSON.stringify(report, null, 2));
      }
    } catch (e) {
      console.error("Failed to download report via Tauri:", e);
      // Fallback to web approach
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const defaultName = 'memberId' in report ? `${report.memberName}_Report` : `${report.groupName}_Report`;
      a.download = filename || `${defaultName}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  // Notify a member that their report was downloaded
  function notifyReportDownloaded(targetMemberId: string) {
    const payload = {
      type: 'REPORT_DOWNLOADED',
      payload: {
        downloadedBy: myProfile.id,
        downloadedByName: myProfile.name,
        targetMemberId,
        timestamp: Date.now()
      }
    };

    if (isLeader.value) {
      broadcast(payload);
    } else {
      connections.value.forEach(c => c.send(payload));
    }
  }

  // =============================================

  return {
    myProfile,
    members,
    messages,
    activeGoal,
    isLeader,
    currentTeamId,
    isConnected,
    voiceActive,
    remoteStreams,
    localStream,
    // Voice Controls
    isMuted,
    isCameraOn,
    isScreenSharing,
    audioInputDevices,
    audioOutputDevices,
    videoInputDevices,
    selectedAudioInput,
    selectedAudioOutput,
    // Group code system (Team page)
    groupName,
    groupCode,
    groupLeaderPeerId,
    // Actions
    saveProfile,
    ensureProfile,
    createTeam,
    joinTeam,
    leaveTeam,
    setGoal,
    updateGoalStatus,
    kickMember,
    sendMessage,
    sendProgress,
    sendActivity,
    joinVoice,
    leaveVoice,
    toggleCamera,
    shareScreen,
    toggleMute,
    loadDevices,
    switchAudioInput,
    fetchDesktopSources,
    desktopSources,
    // Team page group code functions
    createGroup,
    joinGroupByCode,
    leaveGroup,
    restoreGroupState,
    saveGroupState,
    generateGroupCode,
    // Activity sharing
    broadcastActivity,
    broadcastActivitySession,
    // Statistics
    getMemberStats,
    getOnlineTimeRanking,
    getTeamStats,
    // Reports
    generateGroupReport,
    generateMemberReport,
    downloadReport,
    notifyReportDownloaded,
    // Internal broadcast for forwarding
    broadcast
  };
});
