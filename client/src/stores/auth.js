import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';

export const useAuthStore = defineStore('auth', () => {
  const user  = ref(JSON.parse(localStorage.getItem('pj_user') || 'null'));
  const token = ref(localStorage.getItem('pj_token') || null);

  const isLoggedIn = computed(() => !!token.value && !!user.value);
  const isAdmin    = computed(() => user.value?.role === 'admin');

  function setAuth(data) {
    token.value = data.token;
    user.value  = data.user;
    localStorage.setItem('pj_token', data.token);
    localStorage.setItem('pj_user',  JSON.stringify(data.user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
  }

  function logout() {
    token.value = null;
    user.value  = null;
    localStorage.removeItem('pj_token');
    localStorage.removeItem('pj_user');
    delete axios.defaults.headers.common['Authorization'];
  }

  async function init() {
    if (!token.value) return;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
    try {
      const { data } = await axios.get('/api/auth/me');
      user.value = data.user;
      localStorage.setItem('pj_user', JSON.stringify(data.user));
    } catch {
      logout();
    }
  }

  async function login(loginVal, password) {
    const { data } = await axios.post('/api/auth/login', { login: loginVal, password });
    setAuth(data);
  }

  async function register(payload) {
    const { data } = await axios.post('/api/auth/register', payload);
    setAuth(data);
  }

  return { user, token, isLoggedIn, isAdmin, init, login, register, logout, setAuth };
});
