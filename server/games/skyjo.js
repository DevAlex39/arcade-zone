// Logique serveur Cell Number (Skyjo) multijoueur

const COLS = 4, ROWS = 3, HAND_SIZE = 12;
const END_SCORE = 100;

function createDeck() {
  const d = [];
  for (let i = 0; i < 5;  i++) d.push(-2);
  for (let i = 0; i < 10; i++) d.push(-1);
  for (let i = 0; i < 15; i++) d.push(0);
  for (let v = 1; v <= 12; v++)
    for (let i = 0; i < 10; i++) d.push(v);
  return shuffle(d);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function colIndices(col) { return [col, col + COLS, col + COLS * 2]; }

// Returns true if any column was eliminated
function checkColumnElimination(cards, discard) {
  let changed = false;
  for (let c = 0; c < COLS; c++) {
    const idx = colIndices(c);
    if (idx.every(i => cards[i]?.revealed && !cards[i]?.eliminated)) {
      const val = cards[idx[0]].value;
      if (idx.every(i => cards[i].value === val)) {
        idx.forEach(i => { cards[i].eliminated = true; });
        if (discard) discard.push(val); // les 3 cartes vont sur la défausse (règle officielle)
        changed = true;
      }
    }
  }
  return changed;
}

function visibleScore(cards) {
  return cards.filter(c => c.revealed && !c.eliminated).reduce((s, c) => s + c.value, 0);
}

function totalScore(cards) {
  return cards.filter(c => !c.eliminated).reduce((s, c) => s + c.value, 0);
}

function allRevealed(cards) {
  return cards.every(c => c.revealed || c.eliminated);
}

function dealHand(deck) {
  const hand = [];
  for (let i = 0; i < HAND_SIZE; i++) {
    hand.push({ value: deck.pop(), revealed: false, eliminated: false });
  }
  return hand;
}

function deckPop(deck, discard) {
  if (deck.length === 0) {
    // Reshuffler la défausse sauf le dessus
    const top = discard.pop();
    const reshuffled = shuffle(discard.splice(0));
    reshuffled.forEach(v => deck.push(v));
    discard.push(top);
  }
  return deck.pop();
}

function initGame(players) {
  const deck = createDeck();
  const hands = {};
  players.forEach(p => { hands[p.id] = dealHand(deck); });
  const firstDiscard = deck.pop();

  return {
    players:         players.map(p => ({ id: p.id, username: p.username, isAI: !!p.isAI })),
    deck,
    discard:         [firstDiscard],
    hands,
    playerOrder:     players.map(p => p.id),
    curPlayer:       0,
    phase:           'initFlip',
    initFlipPlayer:  0,
    initFlipCount:   0,
    heldCard:        null,
    heldFrom:        null,
    endTriggeredBy:  null,
    lastTurnCount:   0,
    roundScores:     Object.fromEntries(players.map(p => [p.id, null])),
  };
}

module.exports = { createDeck, shuffle, colIndices, checkColumnElimination, visibleScore, totalScore, allRevealed, dealHand, deckPop, initGame, COLS, ROWS, HAND_SIZE, END_SCORE };
