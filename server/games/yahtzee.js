// Logique serveur Yahtzee multijoueur

const SCORABLE = ['ones','twos','threes','fours','fives','sixes','threeKind','fourKind','fullHouse','smStraight','lgStraight','yahtzee','chance'];

function calcScore(dice, cat) {
  const counts = Array(7).fill(0);
  dice.forEach(d => counts[d]++);
  const sum = dice.reduce((a,b) => a+b, 0);
  switch (cat) {
    case 'ones':       return counts[1];
    case 'twos':       return counts[2] * 2;
    case 'threes':     return counts[3] * 3;
    case 'fours':      return counts[4] * 4;
    case 'fives':      return counts[5] * 5;
    case 'sixes':      return counts[6] * 6;
    case 'threeKind':  return counts.some(c => c >= 3) ? sum : 0;
    case 'fourKind':   return counts.some(c => c >= 4) ? sum : 0;
    case 'fullHouse':  return counts.some(c => c === 3) && counts.some(c => c === 2) ? 25 : 0;
    case 'smStraight': {
      const u = [...new Set(dice)].sort((a,b) => a-b).join('');
      return ['1234','2345','3456'].some(x => u.includes(x)) ? 30 : 0;
    }
    case 'lgStraight': {
      const u = [...new Set(dice)].sort((a,b) => a-b).join('');
      return ['12345','23456'].includes(u) ? 40 : 0;
    }
    case 'yahtzee':    return counts.some(c => c === 5) ? 50 : 0;
    case 'chance':     return sum;
    default:           return 0;
  }
}

function rollDice(current, kept) {
  return current.map((v, i) => kept[i] ? v : Math.floor(Math.random() * 6) + 1);
}

function computeBonus(scores) {
  const upper = ['ones','twos','threes','fours','fives','sixes'];
  if (!upper.every(id => scores[id] !== undefined)) return undefined;
  return upper.reduce((s,id) => s + (scores[id] ?? 0), 0) >= 63 ? 35 : 0;
}

function computeTotal(scores) {
  return [...SCORABLE, 'bonus'].reduce((s, id) => s + (scores[id] ?? 0), 0);
}

function allPreviews(dice) {
  return Object.fromEntries(SCORABLE.map(cat => [cat, calcScore(dice, cat)]));
}

function isGameOver(scores, playerOrder) {
  return playerOrder.every(pid =>
    SCORABLE.every(cat => scores[pid]?.[cat] !== undefined)
  );
}

function initGame(players) {
  return {
    dice:        [1, 1, 1, 1, 1],
    kept:        [false, false, false, false, false],
    rollsLeft:   3,
    hasRolled:   false,
    curPlayer:   0,
    curRound:    0,
    scores:      Object.fromEntries(players.map(p => [p.id, {}])),
    playerOrder: players.map(p => p.id),
    winner:      null,
  };
}

module.exports = { calcScore, rollDice, computeBonus, computeTotal, allPreviews, isGameOver, initGame, SCORABLE };
