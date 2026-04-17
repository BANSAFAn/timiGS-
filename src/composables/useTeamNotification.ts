import { ref, type Ref } from 'vue';

const teamNotifRef: Ref<{
  reportDownloaded: (name: string) => void;
  memberJoined: (name: string) => void;
  memberLeft: (name: string) => void;
  add: (notif: any) => void;
} | null> = ref(null);

export function setTeamNotifRef(el: {
  reportDownloaded: (name: string) => void;
  memberJoined: (name: string) => void;
  memberLeft: (name: string) => void;
  add: (notif: any) => void;
} | null) {
  teamNotifRef.value = el;
}

export function useTeamNotification() {
  function reportDownloaded(name: string) {
    teamNotifRef.value?.reportDownloaded(name);
  }

  function memberJoined(name: string) {
    teamNotifRef.value?.memberJoined(name);
  }

  function memberLeft(name: string) {
    teamNotifRef.value?.memberLeft(name);
  }

  return {
    reportDownloaded,
    memberJoined,
    memberLeft
  };
}
