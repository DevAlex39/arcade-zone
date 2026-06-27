import { usePlatformStore } from '@/stores/platform.js';

const T = {
  // Common
  'back':            { fr: '← Menu',          en: '← Menu' },
  'back_home':       { fr: 'Retour à l\'accueil', en: 'Back to home' },
  'your_turn':       { fr: 'Votre tour',       en: 'Your turn' },
  'turn_of':         { fr: 'Tour de',          en: 'Turn:' },
  'waiting_game':    { fr: 'En attente de la partie…', en: 'Waiting for the game…' },
  'victory':         { fr: '🏆 Victoire !',    en: '🏆 Victory!' },
  'game_over_title': { fr: '🏁 Fin de partie', en: '🏁 Game over' },
  'winner_label':    { fr: 'Gagnant :',        en: 'Winner:' },
  'you':             { fr: 'vous',             en: 'you' },

  // Lobby
  'lobby.room_code':     { fr: 'Code de la salle',    en: 'Room Code' },
  'lobby.copy_link':     { fr: '📋 Copier le lien',   en: '📋 Copy link' },
  'lobby.copied':        { fr: '✅ Copié !',           en: '✅ Copied!' },
  'lobby.share_hint':    { fr: 'Partagez ce code ou ce QR code — les autres joueurs se connectent sur leur propre appareil.', en: 'Share this code or QR — other players join on their own device.' },
  'lobby.players':       { fr: 'Joueurs',              en: 'Players' },
  'lobby.host':          { fr: 'Hôte',                 en: 'Host' },
  'lobby.online':        { fr: 'En ligne',             en: 'Online' },
  'lobby.disconnected':  { fr: 'Déconnecté',           en: 'Disconnected' },
  'lobby.waiting_slot':  { fr: 'En attente…',          en: 'Waiting…' },
  'lobby.start':         { fr: 'Lancer la partie →',   en: 'Start game →' },
  'lobby.need_players':  { fr: 'Il faut au moins {n} joueurs', en: 'Need at least {n} players' },
  'lobby.waiting_host':  { fr: '⟳ En attente que l\'hôte lance la partie…', en: '⟳ Waiting for the host to start…' },
  'lobby.settings':      { fr: 'Paramètres',           en: 'Settings' },
  'lobby.ai_players':    { fr: 'Joueurs IA',           en: 'AI Players' },
  'lobby.pawns':         { fr: 'Pions par joueur',     en: 'Pawns per player' },
  'lobby.replay_6':      { fr: '🎲 Rejouer sur 6',    en: '🎲 Replay on 6' },
  'lobby.allow_overtake':   { fr: 'Autoriser le dépassement', en: 'Allow overtaking' },
  'lobby.corridor_simple':  { fr: 'Corridor simplifié',       en: 'Simplified corridor' },
  'lobby.lives':         { fr: 'Vies de départ',       en: 'Starting lives' },
  'lobby.attempts':      { fr: 'Essais par mot',       en: 'Attempts per word' },
  'lobby.min_letters':   { fr: 'Lettres min',          en: 'Min letters' },
  'lobby.max_letters':   { fr: 'Lettres max',          en: 'Max letters' },
  'lobby.same_word':     { fr: 'Même mot pour tous',   en: 'Same word for all' },
  'lobby.combo_mode':    { fr: 'Mode Combo (×2, ×3…)', en: 'Combo Mode (×2, ×3…)' },
  'lobby.change_on_find':{ fr: 'Changer de mot dès qu\'un joueur trouve', en: 'Change word when someone finds it' },
  'lobby.word_lang':     { fr: 'Langue des mots',      en: 'Word language' },
  'lobby.categories':    { fr: 'Catégories',           en: 'Categories' },
  'lobby.cat_all':       { fr: 'Tous les mots',        en: 'All words' },
  'lobby.cat_animals':   { fr: 'Animaux',              en: 'Animals' },
  'lobby.cat_food':      { fr: 'Cuisine & Nourriture', en: 'Food & Cooking' },
  'lobby.cat_sport':     { fr: 'Sport',                en: 'Sports' },
  'lobby.cat_nature':    { fr: 'Nature & Plantes',     en: 'Nature & Plants' },
  'lobby.cat_geo':       { fr: 'Géographie',           en: 'Geography' },
  'lobby.cat_jobs':      { fr: 'Métiers',              en: 'Careers' },
  'lobby.cat_body':      { fr: 'Corps humain',         en: 'Human body' },
  'lobby.cat_transport': { fr: 'Transport',            en: 'Transport' },

  // Cell Number (Skyjo)
  'skyjo.draw':       { fr: 'Piochez une carte',     en: 'Draw a card' },
  'skyjo.hold':       { fr: 'Échangez ou défaussez', en: 'Swap or discard' },
  'skyjo.flip_one':   { fr: 'Retournez une carte',   en: 'Flip a card' },
  'skyjo.last_turn':  { fr: '⚠️ Dernier tour !',     en: '⚠️ Last turn!' },
  'skyjo.init_flip':  { fr: 'Retournez 2 cartes ({name})', en: 'Flip 2 cards ({name})' },
  'skyjo.deck':       { fr: 'Pioche',                en: 'Deck' },
  'skyjo.discard':    { fr: 'Défausse',              en: 'Discard' },
  'skyjo.held_hint':  { fr: 'Cliquez une carte pour échanger', en: 'Click a card to swap' },
  'skyjo.discard_flip':{ fr: 'Défausser + Retourner', en: 'Discard + Flip' },
  'skyjo.pts':        { fr: 'pts',                   en: 'pts' },

  // Petits Chevaux
  'pc.roll':          { fr: '🎲 Lancer',             en: '🎲 Roll' },
  'pc.click_pion':    { fr: 'Cliquez sur un pion doré pour le déplacer', en: 'Click a golden pawn to move' },
  'pc.roll_hint':     { fr: 'Lancez le dé !',        en: 'Roll the die!' },
  'pc.waiting_for':   { fr: 'En attente de {name}…', en: 'Waiting for {name}…' },
  'pc.wins':          { fr: '{name} gagne !',        en: '{name} wins!' },
  'pc.game_over':     { fr: 'Fin de partie !',       en: 'Game over!' },
  'pc.red':           { fr: 'Rouge',                 en: 'Red' },
  'pc.blue':          { fr: 'Bleu',                  en: 'Blue' },
  'pc.green':         { fr: 'Vert',                  en: 'Green' },
  'pc.yellow':        { fr: 'Jaune',                 en: 'Yellow' },

  // Yahtzee
  'ytz.rolls_left':   { fr: '{n} lancer(s) restant(s)', en: '{n} roll(s) left' },
  'ytz.round':        { fr: 'Manche {n}',            en: 'Round {n}' },
  'ytz.roll':         { fr: '🎲 Lancer ({n})',        en: '🎲 Roll ({n})' },
  'ytz.scores':       { fr: 'Scores',                en: 'Scores' },
  'ytz.category':     { fr: 'Catégorie',             en: 'Category' },
  'ytz.bonus':        { fr: 'Bonus (+35 si ≥63)',    en: 'Bonus (+35 if ≥63)' },
  'ytz.total':        { fr: 'Total',                 en: 'Total' },
  'ytz.defeat':       { fr: '😔 Fin de partie',      en: '😔 Game over' },
  'ytz.ones':         { fr: '1 — As',                en: '1 — Aces' },
  'ytz.twos':         { fr: '2 — Deux',              en: '2 — Twos' },
  'ytz.threes':       { fr: '3 — Trois',             en: '3 — Threes' },
  'ytz.fours':        { fr: '4 — Quatre',            en: '4 — Fours' },
  'ytz.fives':        { fr: '5 — Cinq',              en: '5 — Fives' },
  'ytz.sixes':        { fr: '6 — Six',               en: '6 — Sixes' },
  'ytz.threeKind':    { fr: 'Brelan',                en: 'Three of a Kind' },
  'ytz.fourKind':     { fr: 'Carré',                 en: 'Four of a Kind' },
  'ytz.fullHouse':    { fr: 'Full (25 pts)',          en: 'Full House (25 pts)' },
  'ytz.smStraight':   { fr: 'Petite suite (30)',     en: 'Small Straight (30)' },
  'ytz.lgStraight':   { fr: 'Grande suite (40)',     en: 'Large Straight (40)' },
  'ytz.yahtzee':      { fr: 'Yahtzee (50)',          en: 'Yahtzee (50)' },
  'ytz.chance':       { fr: 'Chance',                en: 'Chance' },
};

export function useI18n() {
  const platform = usePlatformStore();

  function t(key, params = {}) {
    const entry = T[key];
    if (!entry) return key;
    let str = entry[platform.lang] ?? entry.fr ?? key;
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, v);
    }
    return str;
  }

  return { t };
}
