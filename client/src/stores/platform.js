import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

export const usePlatformStore = defineStore('platform', () => {
  const games       = ref([]);
  const currentRoom = ref(null);
  const toast       = ref(null);
  const theme       = ref(localStorage.getItem('az-theme') || 'cobalt');
  const lang        = ref(localStorage.getItem('az-lang')  || 'fr');

  function setTheme(t) {
    theme.value = t;
    localStorage.setItem('az-theme', t);
    document.documentElement.setAttribute('data-theme', t);
  }

  function setLang(l) {
    lang.value = l;
    localStorage.setItem('az-lang', l);
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', theme.value);
  }

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

  return { games, currentRoom, toast, theme, lang, fetchGames, showToast, createRoom, fetchRoom, joinRoom, setTheme, setLang, applyTheme };
});
