import { defineStore } from "pinia";
import { ref, reactive, computed } from "vue";
import Peer, { type DataConnection, type MediaConnection } from "peerjs";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile, remove } from "@tauri-apps/plugin-fs";
import { useActivityStore, detectCategory, CATEGORY_STYLES } from "./activity";
import { i18n } from "../i18n";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  isLeader: boolean;
  status: 'online' | 'offline' | 'busy' | 'voice';
  isScreenSharing?: boolean;
  currentApp?: string;
  progress?: {
    appName: string;
    current: number;
    target: number;
    percentage: number;
  };
  joinedAt: number;
  totalOnlineSeconds: number;
  activityHistory: ActivityEntry[];
  lastSeen: number;
  tasks?: string[];
  inTimeout?: boolean;
  focusModeActive?: boolean;
  focusTargetApp?: string;
  currentMusicTitle?: string;
  currentMusicArtist?: string;
  musicSharingEnabled?: boolean;
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
  tasks?: string[];
  inTimeout?: boolean;
  focusModeActive?: boolean;
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

  const myProfile = reactive({
    name: "", // Will be set by ensureProfile() to PC computer name
    email: localStorage.getItem("timigs_team_email") || "",
    id: "", // Assigned by PeerJS
    focusTargetApp: "",
    currentMusicTitle: "",
    currentMusicArtist: "",
    musicSharingEnabled: localStorage.getItem("timigs_team_share_music") !== "false",
  });


  const peer = ref<Peer | null>(null);
  const connections = ref<DataConnection[]>([]); // For Leader: all members. For Member: just Leader.
  const isLeader = ref(false);
  const currentTeamId = ref<string>(""); // Leader's Peer ID


  const groupName = ref<string>("");
  const groupCode = ref<string>(""); // 6-char short code for joining
  const groupLeaderPeerId = ref<string>(""); // The peer ID of the group leader

  const members = ref<TeamMember[]>([]);
  const messages = ref<ChatMessage[]>([]);
  const activeGoal = ref<TeamGoal | null>(null);


  const localStream = ref<MediaStream | null>(null);
  const voiceConnections = ref<MediaConnection[]>([]);
  const voiceActive = ref(false);
  const remoteStreams = ref<Map<string, MediaStream>>(new Map());


  const isMuted = ref(false);
  const isCameraOn = ref(false);
  const isScreenSharing = ref(false);


  const audioInputDevices = ref<MediaDeviceInfo[]>([]);
  const audioOutputDevices = ref<MediaDeviceInfo[]>([]);
  const videoInputDevices = ref<MediaDeviceInfo[]>([]);
  const selectedAudioInput = ref<string>("");
  const selectedAudioOutput = ref<string>("");
  const lastActivityApp = ref("");
  const activityPollInterval = ref<number | null>(null);
  const unlistenTick = ref<(() => void) | null>(null);

  const isConnected = computed(() => !!peer.value && !peer.value.disconnected);
  const isInGroup = computed(() => !!groupCode.value);


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

  function initializePeer(customId?: string) {
    return new Promise<string>((resolve, reject) => {
      const targetId = customId ? `timigs-group-${customId.toUpperCase()}` : undefined;
      const currentPeer = peer.value;

      if (currentPeer) {
        if (targetId && currentPeer.id !== targetId) {
          currentPeer.destroy();
          peer.value = null;
        } else {
          resolve(currentPeer.id);
          return;
        }
      }

      if (!targetId && currentPeer) {
        resolve(currentPeer.id);
        return;
      }

      const newPeer = targetId ? new Peer(targetId) : new Peer();

      newPeer.on('open', (id) => {
        myProfile.id = id;
        peer.value = newPeer;
        console.log("My Peer ID:", id);

        newPeer.on('connection', handleIncomingConnection);
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


  async function joinVoice(video = false) {
    if (voiceActive.value) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: video ? { width: 1280, height: 720 } : false
        });
        localStream.value = stream;
        voiceActive.value = true;


        updateMyStatus('voice');


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

          videoTrack.enabled = !videoTrack.enabled;



      } else {

          try {
              const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
              const newTrack = videoStream.getVideoTracks()[0];
              localStream.value.addTrack(newTrack);


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




             screenStream = await navigator.mediaDevices.getUserMedia({
                 audio: false,
                 video: {
                     mandatory: {
                         chromeMediaSource: 'desktop',
                         chromeMediaSourceId: sourceId
                     }
                 } as any
             });
          } else {
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
      remoteStreams.value = new Map();
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
          remoteStreams.value = new Map(remoteStreams.value);
      });
      call.on('close', () => {
          remoteStreams.value.delete(call.peer);
          remoteStreams.value = new Map(remoteStreams.value);
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
        conn.send({
          type: 'PROFILE_RESPONSE',
          payload: { name: myProfile.name, email: myProfile.email, isLeader: isLeader.value }
        });
        break;

      case 'PROFILE_RESPONSE':
        handleProfileResponse(data.payload, conn);
        break;

      case 'SYNC_STATE':
        if (!isLeader.value) {
          members.value = data.payload.members;
          activeGoal.value = data.payload.goal;
          if (data.payload.groupName !== undefined) {
            groupName.value = data.payload.groupName;
          }
          saveGroupState();
        }
        break;

      case 'STATUS_UPDATE':
         const m = members.value.find(mem => mem.id === data.payload.id);
         if (m) {
             m.status = data.payload.status;
             if (data.payload.isScreenSharing !== undefined) {
                 m.isScreenSharing = data.payload.isScreenSharing;
             }
             if (data.payload.name !== undefined) {
                 m.name = data.payload.name;
             }
             saveGroupState();
         }
         if (isLeader.value) broadcast(data, conn.peer);
         break;

      case 'CHAT_MESSAGE':
        messages.value.push(data.payload);
        saveGroupState();
        if (isLeader.value) {
           broadcast({ type: 'CHAT_MESSAGE', payload: data.payload }, conn.peer);
        }
        break;

      case 'PROGRESS_UPDATE':
        if (isLeader.value) {
          updateMemberProgress(conn.peer, data.payload);
          broadcastState();
          saveGroupState();
        }
        break;

      case 'ACTIVITY_UPDATE':
         if (isLeader.value) {
            updateMemberActivity(conn.peer, data.payload.appName);
            broadcastState();
            saveGroupState();
         }
         break;

      case 'ACTIVITY_BROADCAST':
         handleActivityBroadcast(data.payload);
         break;

      case 'ACTIVITY_SESSION':
         handleActivitySession(data.payload);
         break;

      case 'SYSTEM_NOTIFICATION':
         const notificationStore = (await import('./notifications')).useNotificationStore();
         notificationStore.add({
             title: data.payload.title,
             message: data.payload.body,
             type: data.payload.type || 'info',
             duration: 10000
         });
         break;

      case 'REPORT_DOWNLOADED':
         break;

      case 'KICK':
         leaveGroup();
         break;

      case 'RENAME_COMMAND':
         myProfile.name = data.payload.newName;
         localStorage.setItem("timigs_team_name", data.payload.newName);
         const selfMember = members.value.find(mem => mem.id === myProfile.id);
         if (selfMember) {
           selfMember.name = data.payload.newName;
         }
         connections.value.forEach(c => c.send({
           type: 'STATUS_UPDATE',
           payload: { id: myProfile.id, name: data.payload.newName }
         }));
         saveGroupState();
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


     let index = members.value.findIndex(m => m.id === conn.peer);
     if (index === -1 && payload.name) {
       index = members.value.findIndex(m => m.name === payload.name && m.id !== myProfile.id && !m.isLeader);
     }

     if (index !== -1) {
       const oldId = members.value[index].id;
       members.value[index] = { 
         ...members.value[index], 
         id: conn.peer, // Update to the new Peer ID!
         name: payload.name || members.value[index].name,
         email: payload.email || members.value[index].email,
         status: 'online',
         lastSeen: Date.now()
       };

       if (oldId !== conn.peer) {
         messages.value.forEach(msg => {
           if (msg.senderId === oldId) msg.senderId = conn.peer;
         });
       }
     } else {
       members.value.push(newMember);
     }

     if (isLeader.value) {
       broadcastState();
     }
     saveGroupState();
  }

  function updateMemberProgress(peerId: string, progress: any) {
    const member = members.value.find(m => m.id === peerId);
    if (member) {
      member.progress = progress;
    }
  }



  async function createTeam() {
    await initializePeer();
    isLeader.value = true;
    currentTeamId.value = myProfile.id;

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
    saveGroupState();
  }

  function updateGoalStatus(status: 'completed' | 'failed' | 'cancelled') {
      if (activeGoal.value) {
          activeGoal.value.status = status;
          broadcastState();
          saveGroupState();
      }
  }

  function kickMember(memberId: string) {
      if (!isLeader.value) return;

      const conn = connections.value.find(c => c.peer === memberId);
      if (conn) {
          conn.send({ type: 'KICK' });
          conn.close();
      }

      members.value = members.value.filter(m => m.id !== memberId);
      broadcastState();
      saveGroupState();
  }

  function broadcastState() {
    if (!isLeader.value) return;
    const state = {
      type: 'SYNC_STATE',
      payload: {
        members: members.value,
        goal: activeGoal.value,
        groupName: groupName.value,
      }
    };
    connections.value.forEach(conn => conn.send(state));
  }

  function broadcast(msg: any, excludeId?: string) {
    connections.value.forEach(conn => {
      if (conn.peer !== excludeId) conn.send(msg);
    });
  }



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

      updateMemberActivity(myProfile.id, appName);
      if (isLeader.value) broadcastState();
  }

  function updateMemberActivity(peerId: string, appName: string) {
      const m = members.value.find(x => x.id === peerId);
      if (m) m.currentApp = appName;
  }







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

  async function createGroup(name?: string): Promise<{ groupCode: string; groupName: string }> {
    const code = generateGroupCode();
    const gName = generateGroupName(name || '');

    await initializePeer(code);

    isLeader.value = true;
    currentTeamId.value = myProfile.id;
    groupLeaderPeerId.value = myProfile.id;
    groupCode.value = code;
    groupName.value = gName;

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

    await saveGroupState();
    await startActivityPolling();

    return { groupCode: code, groupName: gName };
  }

  async function joinGroupByCode(code: string): Promise<boolean> {
    const cleanCode = code.trim().toUpperCase();
    const leaderPeerId = `timigs-group-${cleanCode}`;

    await initializePeer();

    isLeader.value = false;
    currentTeamId.value = leaderPeerId;
    groupLeaderPeerId.value = leaderPeerId;
    groupCode.value = cleanCode;

    return new Promise<boolean>((resolve) => {
      let resolved = false;

      const conn = peer.value!.connect(leaderPeerId);

      const onOpen = () => {
        if (resolved) return;
        resolved = true;
        console.log("Connected to Group Leader:", leaderPeerId);
        connections.value.push(conn);
        
        cleanup();
        saveGroupState().then(() => {
          startActivityPolling().then(() => {
            resolve(true);
          });
        });
      };

      const onError = (err: any) => {
        if (resolved) return;
        if (err.type === 'peer-unavailable' || err.message?.includes('unavailable')) {
          resolved = true;
          cleanup();
          leaveGroup();
          resolve(false);
        }
      };

      const cleanup = () => {
        conn.off('open', onOpen);
        peer.value!.off('error', onError);
      };

      conn.on('open', onOpen);
      peer.value!.on('error', onError);

      conn.on('data', (d: any) => handleData(d, conn));
      conn.on('close', leaveGroup);

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          leaveGroup();
          resolve(false);
        }
      }, 7000);
    });
  }

  async function getTempStateFilePath() {
    try {
      const { tempDir, join } = await import("@tauri-apps/api/path");
      const tmp = await tempDir();
      return await join(tmp, 'timigs_team_state.json');
    } catch (err) {
      console.error("Failed to get temp path:", err);
      return null;
    }
  }

  function leaveGroup() {
    stopActivityPolling();
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
    localStorage.removeItem('timigs_team_full_data');

    getTempStateFilePath().then(path => {
      if (path) {
        remove(path).catch(() => {});
      }
    });
  }

  async function saveGroupState() {
    const state = {
      groupCode: groupCode.value,
      groupName: groupName.value,
      isLeader: isLeader.value,
      groupLeaderPeerId: groupLeaderPeerId.value,
      profileName: myProfile.name,
      myPeerId: myProfile.id
    };
    localStorage.setItem('timigs_group_state', JSON.stringify(state));

    const fullData = {
      members: members.value,
      messages: messages.value,
      activeGoal: activeGoal.value
    };
    localStorage.setItem('timigs_team_full_data', JSON.stringify(fullData));

    try {
      const path = await getTempStateFilePath();
      if (path) {
        await writeTextFile(path, JSON.stringify(fullData, null, 2));
      }
    } catch (err) {
      console.error("Failed to save team state to temp file:", err);
    }
  }

  async function restoreGroupState(): Promise<boolean> {
    const isFresh = !sessionStorage.getItem('timigs_session_active');
    sessionStorage.setItem('timigs_session_active', 'true');
    const saved = localStorage.getItem('timigs_group_state');
    if (!saved) return false;
    if (isFresh) {
      localStorage.setItem('timigs_disconnected_on_restart', 'true');
      leaveGroup();
      return false;
    }

    try {
      const state = JSON.parse(saved);
      if (!state.groupCode || !state.groupLeaderPeerId) return false;

      groupCode.value = state.groupCode;
      groupName.value = state.groupName || 'Team Group';
      isLeader.value = state.isLeader;
      groupLeaderPeerId.value = state.groupLeaderPeerId;

      let restoredData: any = null;
      try {
        const path = await getTempStateFilePath();
        if (path) {
          const fileContent = await readTextFile(path);
          if (fileContent) {
            restoredData = JSON.parse(fileContent);
          }
        }
      } catch (err) {
        console.error("Failed to restore team state from temp file:", err);
      }

      if (!restoredData) {
        const fullSaved = localStorage.getItem('timigs_team_full_data');
        if (fullSaved) {
          restoredData = JSON.parse(fullSaved);
        }
      }

      if (restoredData) {
        members.value = restoredData.members || [];
        messages.value = restoredData.messages || [];
        activeGoal.value = restoredData.activeGoal || null;
      }

      const oldMyPeerId = state.myPeerId;

      if (state.isLeader) {
        await initializePeer(groupCode.value);

        if (oldMyPeerId && oldMyPeerId !== myProfile.id) {
          const selfIndex = members.value.findIndex(m => m.id === oldMyPeerId);
          if (selfIndex !== -1) {
            members.value[selfIndex].id = myProfile.id;
          }
          messages.value.forEach(msg => {
            if (msg.senderId === oldMyPeerId) msg.senderId = myProfile.id;
          });
        } else {
          const selfIndex = members.value.findIndex(m => m.isLeader === true || m.name === myProfile.name);
          if (selfIndex !== -1) {
            members.value[selfIndex].id = myProfile.id;
          }
        }

        updateMyStatus('online');
      } else {
        await initializePeer();

        if (oldMyPeerId && oldMyPeerId !== myProfile.id) {
          const selfIndex = members.value.findIndex(m => m.id === oldMyPeerId);
          if (selfIndex !== -1) {
            members.value[selfIndex].id = myProfile.id;
          }
          messages.value.forEach(msg => {
            if (msg.senderId === oldMyPeerId) msg.senderId = myProfile.id;
          });
        }

        await joinGroupByCode(state.groupCode);
      }

      await startActivityPolling();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  function broadcastActivity(activity: { 
    appName: string; 
    windowTitle: string; 
    category: string; 
    inTimeout?: boolean; 
    focusModeActive?: boolean;
    focusTargetApp?: string;
    currentMusicTitle?: string;
    currentMusicArtist?: string;
    musicSharingEnabled?: boolean;
  }) {
    const payload = {
      type: 'ACTIVITY_BROADCAST',
      payload: {
        memberId: myProfile.id,
        appName: activity.appName || 'Unknown',
        windowTitle: activity.windowTitle || '',
        category: activity.category || 'Uncategorized',
        timestamp: Date.now(),
        inTimeout: activity.inTimeout || false,
        focusModeActive: activity.focusModeActive || false,
        focusTargetApp: activity.focusTargetApp || '',
        currentMusicTitle: activity.currentMusicTitle || '',
        currentMusicArtist: activity.currentMusicArtist || '',
        musicSharingEnabled: activity.musicSharingEnabled !== false,
      }
    };

    updateMemberActivity(myProfile.id, activity.appName);
    const self = members.value.find(m => m.id === myProfile.id);
    if (self) {
      self.lastSeen = Date.now();
      self.currentApp = activity.appName;
      self.inTimeout = activity.inTimeout || false;
      self.focusModeActive = activity.focusModeActive || false;
      self.focusTargetApp = activity.focusTargetApp || '';
      self.currentMusicTitle = activity.currentMusicTitle || '';
      self.currentMusicArtist = activity.currentMusicArtist || '';
      self.musicSharingEnabled = activity.musicSharingEnabled !== false;
    }

    if (isLeader.value) {
      broadcast(payload);
    } else {
      connections.value.forEach(c => c.send(payload));
    }
    saveGroupState();
  }

  function handleActivityBroadcast(payload: any) {
    const m = members.value.find(x => x.id === payload.memberId);
    if (m) {
      m.currentApp = payload.appName;
      m.lastSeen = payload.timestamp;
      m.inTimeout = payload.inTimeout || false;
      m.focusModeActive = payload.focusModeActive || false;
      m.focusTargetApp = payload.focusTargetApp || '';
      m.currentMusicTitle = payload.currentMusicTitle || '';
      m.currentMusicArtist = payload.currentMusicArtist || '';
      m.musicSharingEnabled = payload.musicSharingEnabled !== false;

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

      if (m.activityHistory.length > 200) {
        m.activityHistory = m.activityHistory.slice(-200);
      }
      saveGroupState();
    }

    if (isLeader.value) {
      broadcast({ type: 'ACTIVITY_BROADCAST', payload });
    }
  }


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
    saveGroupState();
  }


  function handleActivitySession(payload: any) {
    const m = members.value.find(x => x.id === payload.memberId);
    if (m) {
      m.activityHistory.push(payload.entry);
      m.totalOnlineSeconds += payload.entry.durationSeconds;

      if (m.activityHistory.length > 200) {
        m.activityHistory = m.activityHistory.slice(-200);
      }
      saveGroupState();
    }

    if (isLeader.value) {
      broadcast({ type: 'ACTIVITY_SESSION', payload });
    }
  }






  function getMemberStats(memberId: string): MemberStats | null {
    const member = members.value.find(m => m.id === memberId);
    if (!member) return null;

    const activeDuration = Date.now() - member.joinedAt;


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
    const categoryBreakdown: CategoryBreakdown[] = Array.from(categoryMap.entries())
      .map(([category, totalSeconds]) => {
        const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.Uncategorized;
        return {
          category,
          totalSeconds,
          percentage: totalCategorySeconds > 0 ? Math.round((totalSeconds / totalCategorySeconds) * 100) : 0,
          color: style.color
        };
      })
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


  function getTeamStats() {
    const totalMembers = members.value.length;
    const onlineMembers = members.value.filter(m => m.status === 'online' || m.status === 'voice').length;
    const totalOnlineSeconds = members.value.reduce((sum, m) => sum + m.totalOnlineSeconds, 0);


    const appMap = new Map<string, number>();
    members.value.forEach(member => {
      member.activityHistory.forEach(entry => {
        appMap.set(entry.appName, (appMap.get(entry.appName) || 0) + entry.durationSeconds);
      });
    });

    const topApp = Array.from(appMap.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || i18n.global.t('team.na');

    return {
      totalMembers,
      onlineMembers,
      totalOnlineSeconds,
      topApp
    };
  }






  function generateGroupReport(): TeamReport {
    const memberReports: TeamMemberReport[] = members.value.map(member => ({
      memberId: member.id,
      memberName: member.name,
      isLeader: member.isLeader,
      totalOnlineSeconds: member.totalOnlineSeconds,
      activityHistory: member.activityHistory,
      stats: getMemberStats(member.id)!,
      tasks: member.tasks || [],
      inTimeout: !!member.inTimeout,
      focusModeActive: !!member.focusModeActive
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

  function generateMemberReport(memberId: string): TeamMemberReport | null {
    const member = members.value.find(m => m.id === memberId);
    if (!member) return null;

    return {
      memberId: member.id,
      memberName: member.name,
      isLeader: member.isLeader,
      totalOnlineSeconds: member.totalOnlineSeconds,
      activityHistory: member.activityHistory,
      stats: getMemberStats(member.id)!,
      tasks: member.tasks || [],
      inTimeout: !!member.inTimeout,
      focusModeActive: !!member.focusModeActive
    };
  }


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

  function loadReportData(report: TeamReport) {
    groupName.value = report.groupName;
    groupCode.value = report.groupCode;
    groupLeaderPeerId.value = report.leaderId;
    members.value = report.members.map(m => ({
      id: m.memberId,
      name: m.memberName,
      email: "",
      isLeader: m.isLeader,
      status: 'offline',
      joinedAt: report.createdAt || Date.now(),
      totalOnlineSeconds: m.totalOnlineSeconds,
      activityHistory: m.activityHistory || [],
      lastSeen: report.generatedAt || Date.now(),
      tasks: m.tasks || [],
      inTimeout: m.inTimeout || false,
      focusModeActive: m.focusModeActive || false
    }));
    saveGroupState();
  }

  function renameMember(memberId: string, newName: string) {
    if (memberId === myProfile.id) {
      myProfile.name = newName;
      localStorage.setItem("timigs_team_name", newName);
      const selfMember = members.value.find(m => m.id === myProfile.id);
      if (selfMember) {
        selfMember.name = newName;
      }
      if (isLeader.value) {
        broadcastState();
      } else {
        connections.value.forEach(c => c.send({
          type: 'STATUS_UPDATE',
          payload: { id: myProfile.id, name: newName }
        }));
      }
    } else if (isLeader.value) {
      const member = members.value.find(m => m.id === memberId);
      if (member) {
        member.name = newName;
        const conn = connections.value.find(c => c.peer === memberId);
        if (conn) {
          conn.send({ type: 'RENAME_COMMAND', payload: { newName } });
        }
        broadcastState();
      }
    }
    saveGroupState();
  }

  function addMemberTask(memberId: string, taskText: string) {
    if (!taskText.trim()) return;
    const member = members.value.find(m => m.id === memberId);
    if (member) {
      if (!member.tasks) member.tasks = [];
      member.tasks.push(taskText.trim());
      if (isLeader.value) {
        broadcastState();
      } else {
        connections.value.forEach(c => c.send({
          type: 'SYNC_STATE',
          payload: { members: members.value, goal: activeGoal.value }
        }));
      }
    }
    saveGroupState();
  }

  function removeMemberTask(memberId: string, index: number) {
    const member = members.value.find(m => m.id === memberId);
    if (member && member.tasks && member.tasks[index] !== undefined) {
      member.tasks.splice(index, 1);
      if (isLeader.value) {
        broadcastState();
      } else {
        connections.value.forEach(c => c.send({
          type: 'SYNC_STATE',
          payload: { members: members.value, goal: activeGoal.value }
        }));
      }
    }
    saveGroupState();
  }

  async function pollCurrentActivity() {
    let isFocusActive = false;
    let isBreakActive = false;
    let focusTargetApp = '';
    let currentMusicTitle = '';
    let currentMusicArtist = '';

    try {
      const focusStatus = await invoke<any>('get_focus_status_cmd');
      isFocusActive = !!(focusStatus && focusStatus.active);
      if (isFocusActive && focusStatus) {
        focusTargetApp = focusStatus.app_name || '';
      }
    } catch (e) {
      console.error('Failed to get focus status in teams store', e);
    }
    try {
      const timeoutStatus = await invoke<any>('get_timeout_status_cmd');
      isBreakActive = !!(timeoutStatus && timeoutStatus.active && timeoutStatus.break_active);
    } catch (e) {
      console.error('Failed to get timeout status in teams store', e);
    }

    if (myProfile.musicSharingEnabled) {
      try {
        const mediaInfo = await invoke<any>('get_current_media_info');
        if (mediaInfo) {
          currentMusicTitle = mediaInfo.title || '';
          currentMusicArtist = mediaInfo.artist || '';
        }
      } catch (e) {
        console.error('Failed to get active media playback info in teams store', e);
      }
    }

    const self = members.value.find(m => m.id === myProfile.id);
    let statusChanged = false;
    if (self) {
      if (
        self.focusModeActive !== isFocusActive || 
        self.inTimeout !== isBreakActive ||
        self.focusTargetApp !== focusTargetApp ||
        self.currentMusicTitle !== currentMusicTitle ||
        self.currentMusicArtist !== currentMusicArtist ||
        self.musicSharingEnabled !== myProfile.musicSharingEnabled
      ) {
        self.focusModeActive = isFocusActive;
        self.inTimeout = isBreakActive;
        self.focusTargetApp = focusTargetApp;
        self.currentMusicTitle = currentMusicTitle;
        self.currentMusicArtist = currentMusicArtist;
        self.musicSharingEnabled = myProfile.musicSharingEnabled;
        statusChanged = true;
      }
    }

    const activityStore = useActivityStore();
    const current = activityStore.currentActivity;
    if (!current) {
      if (statusChanged && self) {
        broadcastActivity({ 
          appName: self.currentApp || 'Unknown', 
          windowTitle: '', 
          category: 'Uncategorized', 
          inTimeout: isBreakActive, 
          focusModeActive: isFocusActive,
          focusTargetApp,
          currentMusicTitle,
          currentMusicArtist,
          musicSharingEnabled: myProfile.musicSharingEnabled
        });
      }
      return;
    }

    const appName = current.app_name || 'Unknown';

    if (appName !== lastActivityApp.value || statusChanged) {
      if (appName !== lastActivityApp.value && lastActivityApp.value) {
        if (self) {
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
            broadcastActivitySession(lastEntry);
          }
        }
      }

      const category = detectCategory(appName, current.exe_path || '');

      if (appName !== lastActivityApp.value) {
        const entry = {
          id: `${myProfile.id}-${Date.now()}`,
          appName,
          windowTitle: current.window_title || '',
          category,
          startTime: Date.now(),
          endTime: Date.now(),
          durationSeconds: 0
        };

        if (self) {
          self.activityHistory.push(entry);
          self.currentApp = appName;
        }
        lastActivityApp.value = appName;
      }

      broadcastActivity({ 
        appName, 
        windowTitle: current.window_title || '', 
        category, 
        inTimeout: isBreakActive, 
        focusModeActive: isFocusActive,
        focusTargetApp,
        currentMusicTitle,
        currentMusicArtist,
        musicSharingEnabled: myProfile.musicSharingEnabled
      });
    }
  }

  async function startActivityPolling() {
    pollCurrentActivity();
    if (!activityPollInterval.value) {
      activityPollInterval.value = window.setInterval(pollCurrentActivity, 10000);
    }
    if (!unlistenTick.value) {
      const { listen } = await import("@tauri-apps/api/event");
      unlistenTick.value = await listen("activity-tracker-tick", () => {
        if (isInGroup.value) {
          pollCurrentActivity();
        }
      });
    }
  }

  function stopActivityPolling() {
    if (activityPollInterval.value) {
      clearInterval(activityPollInterval.value);
      activityPollInterval.value = null;
    }
    if (unlistenTick.value) {
      unlistenTick.value();
      unlistenTick.value = null;
    }
  }

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
    isMuted,
    isCameraOn,
    isScreenSharing,
    audioInputDevices,
    audioOutputDevices,
    videoInputDevices,
    selectedAudioInput,
    selectedAudioOutput,
    groupName,
    groupCode,
    groupLeaderPeerId,
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
    createGroup,
    joinGroupByCode,
    leaveGroup,
    restoreGroupState,
    saveGroupState,
    generateGroupCode,
    broadcastActivity,
    broadcastActivitySession,
    getMemberStats,
    getOnlineTimeRanking,
    getTeamStats,
    generateGroupReport,
    generateMemberReport,
    downloadReport,
    notifyReportDownloaded,
    broadcast,
    loadReportData,
    renameMember,
    addMemberTask,
    removeMemberTask,
    isInGroup,
    startActivityPolling,
    stopActivityPolling,
    pollCurrentActivity
  };
});

