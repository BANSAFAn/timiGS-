import { defineStore } from "pinia";
import { ref, reactive, computed } from "vue";
import Peer, { type DataConnection, type MediaConnection } from "peerjs";

export interface TeamMember {
  id: string; // Peer ID
  name: string;
  email: string; // Optional, can be empty
  isLeader: boolean;
  status: 'online' | 'offline' | 'busy' | 'voice';
  progress?: {
    appName: string;
    current: number; // seconds
    target: number; // seconds
    percentage: number;
  };
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
    name: localStorage.getItem("timigs_team_name") || "",
    email: localStorage.getItem("timigs_team_email") || "",
    id: "", // Assigned by PeerJS
  });

  // State
  const peer = ref<Peer | null>(null);
  const connections = ref<DataConnection[]>([]); // For Leader: all members. For Member: just Leader.
  const isLeader = ref(false);
  const currentTeamId = ref<string>(""); // Leader's Peer ID

  const members = ref<TeamMember[]>([]);
  const messages = ref<ChatMessage[]>([]);
  const activeGoal = ref<TeamGoal | null>(null);
  
  // Voice State
  const localStream = ref<MediaStream | null>(null);
  const voiceConnections = ref<MediaConnection[]>([]);
  const voiceActive = ref(false);
  const remoteStreams = ref<Map<string, MediaStream>>(new Map());

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

  function setProfileFromGoogle(name: string, email: string) {
     if (!myProfile.name) saveProfile(name, email);
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

  async function shareScreen() {
      if (!localStream.value) await joinVoice(false);
      
      try {
          // @ts-ignore - getDisplayMedia exists
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
              video: { cursor: "always" }, 
              audio: false 
          });
          
          const screenTrack = screenStream.getVideoTracks()[0];
          
          screenTrack.onended = () => {
              stopScreenShare(); // Handle "Stop Sharing" floating UI click
          };

          // Replace video track in local stream logic is tricky if we want both Cam + Screen.
          // For now, simpler: Screen replaces Cam or is the only video.
          // Or we trigger a special "SCREEN_SHARE" call?
          // Replacing track is smoothest.
          
          const videoTrack = localStream.value!.getVideoTracks()[0];
          if (videoTrack) {
              videoTrack.stop();
              localStream.value!.removeTrack(videoTrack);
          }
          localStream.value!.addTrack(screenTrack);
          
          // Update peers
          voiceConnections.value.forEach(call => {
               const sender = call.peerConnection.getSenders().find(s => s.track?.kind === 'video');
               if (sender) sender.replaceTrack(screenTrack);
               else call.peerConnection.addTrack(screenTrack, localStream.value!);
          });
          
      } catch (e) {
          console.error("Screen Share Error", e);
      }
  }
  
  function stopScreenShare() {
      // Revert to camera or just audio?
      // For now, just stop video.
       if (localStream.value) {
          const videoTrack = localStream.value.getVideoTracks()[0];
          if (videoTrack) {
              videoTrack.stop();
              localStream.value.removeTrack(videoTrack);
          }
       }
       // Notify peers essentially by track ending or replacing with nothing? 
       // They will see black frame. 
       
       // Ideally we re-enable camera if it was on.
       // toggleCamera(); // logic to start cam
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
      updateMyStatus('online');
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
          // Auto-join voice as listener/talker if called?
          // For now, we must be in voice mode to answer.
          // Or we auto-answer with audio only?
          // Let's simple: Auto answer audio-only if not yet setup.
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
          // Don't auto-play audio element here, we do it in UI
      });
      call.on('close', () => {
          remoteStreams.value.delete(call.peer);
      });
      call.on('error', (e) => console.error("Call error", e));
      voiceConnections.value.push(call);
  }
  
  function updateMyStatus(status: 'online' | 'voice') {
      const self = members.value.find(m => m.id === myProfile.id);
      if (self) self.status = status;
      
      const payload = { id: myProfile.id, status };
       if (isLeader.value) broadcast({ type: 'STATUS_UPDATE', payload });
       else connections.value.forEach(c => c.send({ type: 'STATUS_UPDATE', payload }));
  }


  function handleData(data: any, conn: DataConnection) {
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
         if (m) m.status = data.payload.status;
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
        status: 'online'
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
      status: 'online'
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
    saveProfile,
    setProfileFromGoogle,
    createTeam,
    joinTeam,
    leaveTeam,
    setGoal,
    updateGoalStatus,
    kickMember,
    sendMessage,
    sendProgress,
    joinVoice,
    leaveVoice,
    toggleCamera,
    shareScreen
  };
});
