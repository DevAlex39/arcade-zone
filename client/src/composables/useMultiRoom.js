import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { usePlatformStore } from '@/stores/platform.js';
import { useI18n } from '@/composables/useI18n.js';

/**
 * Logique commune des vues multi : room, hôte, fin de partie, kick.
 * Usage :
 *   const mr = useMultiRoom(props.roomCode);
 *   onMounted(() => { socket = io(...); mr.bind(socket, { onReplay: resetLocal }); ... });
 * Template :
 *   <GameMenu :room="mr.room.value" :is-host="mr.isHost.value" ... @kick="mr.kick" />
 *   <PostGameModal :game-over="mr.gameOver.value" ... @replay="mr.choose('replay')" ... />
 */
export function useMultiRoom(roomCode) {
  const router   = useRouter();
  const auth     = useAuthStore();
  const platform = usePlatformStore();
  const { t }    = useI18n();

  const room     = ref(null);
  const gameOver = ref(null);
  let socket = null;

  const myId   = computed(() => auth.user?.id);
  const isHost = computed(() => {
    if (!room.value || !auth.user) return false;
    if (auth.user.isGuest) return room.value.host_name === auth.user.username;
    return room.value.host_id === auth.user.id;
  });

  function bind(s, { onReplay } = {}) {
    socket = s;
    s.on('room_update', (d) => { room.value = d; });
    s.on('game_over',  (d) => { gameOver.value = d; });
    s.on('host_changed', ({ hostId, hostName }) => {
      const me = auth.user;
      const becameHost = me?.isGuest ? hostName === me.username : String(hostId) === String(me?.id);
      if (becameHost) platform.showToast(t('pg.host_left'), 'success');
    });
    s.on('postgame', ({ action }) => {
      if (action === 'lobby') {
        router.push(`/lobby/${roomCode}`);
      } else if (action === 'replay') {
        gameOver.value = null;
        onReplay?.();
      }
    });
    s.on('kicked', () => {
      platform.showToast('Vous avez été exclu de la partie par l\'hôte', 'error');
      router.push('/');
    });
  }

  // choice: 'replay' | 'lobby' | 'home'
  function choose(choice) {
    if (choice === 'home') {
      socket?.emit('leave_room', roomCode);
      router.push('/');
      return;
    }
    socket?.emit('postgame_choice', { code: roomCode, choice });
  }

  function kick({ targetId, replaceByAI }) {
    socket?.emit('kick_player', { code: roomCode, targetId, replaceByAI });
  }

  return { room, gameOver, isHost, myId, bind, choose, kick };
}
