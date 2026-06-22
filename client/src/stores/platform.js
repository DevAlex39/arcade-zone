import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

export const usePlatformStore = defineStore('platform', () => {
  const games       = ref([]);
  const currentRoom = ref(null);
  const toast       = ref(null);

  async function fetchGames() {
    const { data } = await axios.get('/api/games');
    games.value = data;
  }

  function showToast(msg, type = 'info', duration = 3000) {
    toast.value = { msg, type };
    setTimeout(() => { toast.value = null; }, duration);
  }

  async function createRoom(gameId, settings = {}, guestName = null) {
    const payload = { game_id: gameId, settings };
    if (guestName) payload.guest_name = guestName;
    const { data } = await axios.post('/api/rooms', payload);
    currentRoom.value = data;
    return data;
  }

  async function fetchRoom(code) {
    const { data } = await axios.get(`/api/rooms/${code}`);
    currentRoom.value = data;
    return data;
  }

  async function joinRoom(code, guestName = null) {
    const payload = guestName ? { guest_name: guestName } : {};
    await axios.post(`/api/rooms/${code}/join`, payload);
  }

  return { games, currentRoom, toast, fetchGames, showToast, createRoom, fetchRoom, joinRoom };
});
