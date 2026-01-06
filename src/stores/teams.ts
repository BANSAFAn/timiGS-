import { defineStore } from "pinia";
import { ref, reactive, computed } from "vue";
import Peer, { type DataConnection } from "peerjs";

export interface TeamMember {
  id: string; // Peer ID
  name: string;
  email: string; // Optional, can be empty
  isLeader: boolean;
  status: 'online' | 'offline' | 'busy';
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
        
        resolve(id);
      });

      newPeer.on('error', (err) => {
        console.error("Peer Error:", err);
        reject(err);
      });
    });
  }

  function handleIncomingConnection(conn: DataConnection) {
    // If I am not leader and already connected to someone, I might reject? 
    // Or simpler: anyone takes incoming, but only Leader logic handles grouping.
    
    conn.on('open', () => {
      console.log("New connection from:", conn.peer);
      connections.value.push(conn);
      
      // Request their info
      conn.send({ type: 'REQUEST_PROFILE' });
      
      if (isLeader.value) {
        // As leader, I accept them into the team
        // Wait for profile response to add to members list
      }
    });

    conn.on('data', (data: any) => handleData(data, conn));
    
    conn.on('close', () => {
        // Remove from members
        members.value = members.value.filter(m => m.id !== conn.peer);
        connections.value = connections.value.filter(c => c.peer !== conn.peer);
        broadcastState(); // Notify others
    });
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
        // Or the leader sent their details
        handleProfileResponse(data.payload, conn);
        break;

      case 'SYNC_STATE':
        // Received full state update (usually from Leader)
        if (!isLeader.value) {
          members.value = data.payload.members;
          activeGoal.value = data.payload.goal;
          // Merge messages or replace? Replace for simplicity now, or append new
          // messages.value = data.payload.messages; 
        }
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
    activeGoal.value = { appName, targetSeconds, description: `Work on ${appName} for ${Math.floor(targetSeconds/60)}m` };
    broadcastState();
  }

  function broadcastState() {
    if (!isLeader.value) return;
    const state = {
      type: 'SYNC_STATE',
      payload: {
        members: members.value,
        goal: activeGoal.value,
        // messages: messages.value // Optional sync
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
      // Wait for REQUEST_PROFILE or send immediately?
      // Usually Host asks, but we can preventively send
    });
    conn.on('data', (d) => handleData(d, conn));
    conn.on('close', leaveTeam);
  }

  function leaveTeam() {
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
    saveProfile,
    createTeam,
    joinTeam,
    leaveTeam,
    setGoal,
    sendMessage,
    sendProgress
  };
});
