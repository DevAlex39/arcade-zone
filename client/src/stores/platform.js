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

  async function createRoom(gameId, settings = {}) {
    const { data } = await axios.post('/api/rooms', { game_id: gameId, settings });
    currentRoom.value = data;
    return data;
  }

  async function fetchRoom(code) {
    const { data } = await axios.get(`/api/rooms/${code}`);
    currentRoom.value = data;
    return data;
  }

  async function joinRoom(code) {
    await axios.post(`/api/rooms/${code}/join`);
  }

  return { games, currentRoom, toast, fetchGames, showToast, createRoom, fetchRoom, joinRoom };
});
