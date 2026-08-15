import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { usePlatformStore } from '@/stores/platform.js';
import { useI18n } from '@/composables/useI18n.js';
import { useGameAudio } from '@/composables/useGameAudio.js';

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
  const route    = useRoute();
  const auth     = useAuthStore();
  const platform = usePlatformStore();
  const { t }    = useI18n();

  const audio      = useGameAudio();
  const room       = ref(null);
  const gameOver   = ref(null);
  const tournament = ref(null);   // { phase:'interstitial', standings, nextGameId, idx, total }
  const reactions = ref([]);   // réactions emoji flottantes [{ id, emoji, username, x }]
  let socket = null;
  let _reactionId = 0;
  let _lastSent   = 0;

  const myId   = computed(() => auth.user?.id);
  const isSpectator = computed(() =>
    (room.value?.spectators || []).some(s => String(s.id) === String(auth.user?.id))
  );
  const isHost = computed(() => {
    if (!room.value || !auth.user) return false;
    if (auth.user.isGuest) return room.value.host_name === auth.user.username;
    return room.value.host_id === auth.user.id;
  });

  function bind(s, { onReplay } = {}) {
    socket = s;
    s.on('room_update', (d) => {
      // Pop sonore à l'arrivée / au départ d'un joueur
      const before = (room.value?.players || []).length;
      const after  = (d.players || []).length;
      if (room.value && after > before) audio.pop();
      else if (room.value && after < before) audio.popOut();
      room.value = d;
    });
    s.on('game_over',  (d) => {
      gameOver.value = d;
      const me = auth.user;
      const iWon = d?.winner && (me?.isGuest
        ? d.winner.username === me.username
        : String(d.winner.id) === String(me?.id));
      iWon ? audio.win() : audio.lose();
    });
    s.on('host_changed', ({ hostId, hostName }) => {
      const me = auth.user;
      const becameHost = me?.isGuest ? hostName === me.username : String(hostId) === String(me?.id);
      if (becameHost) { platform.showToast(t('pg.host_left'), 'success'); audio.chime(); }
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
    // ── Tournoi ──
    s.on('tournament_update', (p) => {
      // points mis à jour en fin de jeu (l'écran intermédiaire suit)
      if (tournament.value) tournament.value = { ...tournament.value, ...p };
    });
    s.on('tournament_next', (p) => {
      tournament.value = { ...p, phase: 'interstitial' };
      gameOver.value = null; // pas de modal post-game entre les jeux d'un tournoi
      audio.chime();
    });
    s.on('tournament_end', (p) => {
      tournament.value = { ...p, phase: 'end' };
    });
    // Navigation vers le jeu courant (tournoi : le jeu change entre les manches)
    s.on('game_started', ({ gameId } = {}) => {
      tournament.value = tournament.value ? { ...tournament.value, phase: null } : null;
      if (gameId && route.params.gameId !== gameId) {
        router.push(`/game/${gameId}?room=${roomCode}`);
      }
    });

    s.on('reaction', ({ emoji, username, avatar }) => {
      const id = ++_reactionId;
      // Position horizontale aléatoire pour éviter que tout se superpose
      reactions.value.push({ id, emoji, username: avatar ? `${avatar} ${username}` : username, x: 8 + Math.random() * 80 });
      audio.blip();
      setTimeout(() => { reactions.value = reactions.value.filter(r => r.id !== id); }, 3600);
    });
  }

  function sendReaction(emoji) {
    const now = Date.now();
    if (now - _lastSent < 400) return; // anti-spam local (même règle que le serveur)
    _lastSent = now;
    socket?.emit('send_reaction', { code: roomCode, emoji });
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

  // Tournoi : l'hôte lance le jeu suivant depuis l'écran intermédiaire
  function launchNext() {
    socket?.emit('start_game', roomCode);
  }

  return { room, gameOver, reactions, tournament, isHost, isSpectator, myId, bind, choose, kick, sendReaction, launchNext, audio };
}
