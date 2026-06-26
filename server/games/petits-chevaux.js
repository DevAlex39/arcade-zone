// Logique serveur Petits Chevaux multijoueur

const TRACK_LEN = 56;
const HOME_LEN  = 6;
const POS_STABLE = -1;
const POS_DONE   = TRACK_LEN + HOME_LEN; // 62

// Piste périphérique 15×15 (56 cases, sens horaire)
const TRACK = (() => {
  const t = [];
  for (let r = 14; r >= 0; r--) t.push([r, 0]);        // gauche montant  (15)
  for (let c = 1;  c <= 14; c++) t.push([0, c]);         // haut droite     (14)
  for (let r = 1;  r <= 14; r++) t.push([r, 14]);        // droite descendant (14)
  for (let c = 13; c >= 1;  c--) t.push([14, c]);        // bas gauche      (13)
  return t;
})();

// Case de départ absolue dans TRACK pour chaque couleur
const START_IDX = { red: 8, blue: 22, green: 36, yellow: 50 };

// Couloirs d'arrivée (6 cases vers le centre)
const HOME_PATH = {
  red:    [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
  blue:   [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  green:  [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
  yellow: [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
};

// Emplacements dans l'écurie (pour affichage SVG)
const STABLE_SLOTS = {
  red:    [[2,2],[2,4],[4,2],[4,4],[3,3]],
  blue:   [[2,10],[2,12],[4,10],[4,12],[3,11]],
  green:  [[10,10],[10,12],[12,10],[12,12],[11,11]],
  yellow: [[10,2],[10,4],[12,2],[12,4],[11,3]],
};

const CENTER = [7, 7];

// Cases sécurisées (départs de chaque couleur — on ne peut pas capturer ici)
const SAFE_ABS = new Set(Object.values(START_IDX));

function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

function getAbsPos(relPos, color) {
  return (START_IDX[color] + relPos) % TRACK_LEN;
}

function getPionCell(pos, color) {
  if (pos === POS_STABLE) return null;
  if (pos === POS_DONE) return CENTER;
  if (pos >= TRACK_LEN) return HOME_PATH[color][pos - TRACK_LEN];
  return TRACK[getAbsPos(pos, color)];
}

function computeMovablePawns(pawns, color, diceValue) {
  const movable = [];
  for (let i = 0; i < pawns.length; i++) {
    const p = pawns[i];
    if (p.pos === POS_DONE) continue;
    if (p.pos === POS_STABLE) {
      if (diceValue === 6) movable.push(i);
      continue;
    }
    const newPos = p.pos + diceValue;
    if (newPos > POS_DONE) continue; // dépasserait le centre
    movable.push(i);
  }
  return movable;
}

function applyMove(allPawns, playerOrder, colorMap, movingId, pionIdx, diceValue) {
  const color  = colorMap[movingId];
  const pawns  = allPawns[movingId];
  const pion   = pawns[pionIdx];

  let newPos;
  if (pion.pos === POS_STABLE) {
    newPos = 0; // Sortir de l'écurie → case de départ
  } else {
    newPos = pion.pos + diceValue;
  }
  if (newPos > POS_DONE) newPos = POS_DONE;
  pion.pos = newPos;

  // Captures (uniquement sur la piste principale, pas dans le couloir d'arrivée)
  if (newPos >= 0 && newPos < TRACK_LEN) {
    const absPos = getAbsPos(newPos, color);
    if (!SAFE_ABS.has(absPos)) {
      for (const othId of playerOrder) {
        if (othId === movingId) continue;
        const othColor = colorMap[othId];
        for (const othPion of allPawns[othId]) {
          if (othPion.pos === POS_STABLE || othPion.pos >= TRACK_LEN) continue;
          if (getAbsPos(othPion.pos, othColor) === absPos) {
            othPion.pos = POS_STABLE;
          }
        }
      }
    }
  }
}

function checkWinner(allPawns, playerOrder) {
  for (const pid of playerOrder) {
    if (allPawns[pid].every(p => p.pos === POS_DONE)) return pid;
  }
  return null;
}

function initGame(players, pionsPerPlayer = 2) {
  const colors   = ['red', 'blue', 'green', 'yellow'];
  const colorMap = {};
  players.forEach((p, i) => { colorMap[p.id] = colors[i]; });

  const pawns = {};
  players.forEach(p => {
    pawns[p.id] = Array.from({ length: pionsPerPlayer }, () => ({ pos: POS_STABLE }));
  });

  return {
    players:      players.map(p => ({ id: p.id, username: p.username, isAI: !!p.isAI })),
    playerOrder:  players.map(p => p.id),
    colorMap,
    pawns,
    curPlayer:    0,
    diceValue:    null,
    hasRolled:    false,
    movablePawns: [],
    phase:        'roll',
    winner:       null,
  };
}

module.exports = {
  TRACK, START_IDX, HOME_PATH, STABLE_SLOTS, CENTER, SAFE_ABS,
  TRACK_LEN, HOME_LEN, POS_STABLE, POS_DONE,
  rollDice, getAbsPos, getPionCell, computeMovablePawns, applyMove, checkWinner, initGame,
};
