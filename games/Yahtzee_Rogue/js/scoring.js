'use strict';

// ══════════════════════════════════════════════════════════════════
//  SCORING — validité des combos + calcul Chips × Mult
// ══════════════════════════════════════════════════════════════════
function getEffDice() {
  return G.bossEffect === 'ban1' && G.bannedValue !== null
    ? G.dice.filter(d => d !== G.bannedValue)
    : [...G.dice];
}

function isComboValid(id, effDice) {
  const counts = getCounts(effDice);
  const vals   = Object.values(counts);
  switch (id) {
    case 'ones':      return effDice.some(d=>d===1);
    case 'twos':      return effDice.some(d=>d===2);
    case 'threes':    return effDice.some(d=>d===3);
    case 'fours':     return effDice.some(d=>d===4);
    case 'fives':     return effDice.some(d=>d===5);
    case 'sixes':     return effDice.some(d=>d===6);
    case 'threeKind': return vals.some(c=>c>=3);
    case 'fourKind':  return vals.some(c=>c>=4);
    case 'fullHouse': { const sv=[...vals].sort((a,b)=>b-a); return sv.length>=2 && sv[0]>=3 && sv[1]>=2; }
    case 'smStr':     return hasSeq(effDice, G.jokers.some(j=>j.id==='raccourci')  ? 3 : 4);
    case 'lgStr':     return hasSeq(effDice, G.jokers.some(j=>j.id==='tricheur') ? 4 : 5);
    case 'yahtzee':   return vals.some(c=>c>=5);
    default:          return false;
  }
}

function computeScore(id, effDice, preview = false) {
  const cat  = COMBOS.find(c=>c.id===id);
  const sum  = effDice.reduce((a,b)=>a+b,0);
  let chips  = cat.chips;
  let mult   = cat.mult;

  switch (id) {
    case 'ones':      chips += effDice.filter(d=>d===1).reduce((a,b)=>a+b,0)*5; break;
    case 'twos':      chips += effDice.filter(d=>d===2).reduce((a,b)=>a+b,0)*5; break;
    case 'threes':    chips += effDice.filter(d=>d===3).reduce((a,b)=>a+b,0)*5; break;
    case 'fours':     chips += effDice.filter(d=>d===4).reduce((a,b)=>a+b,0)*5; break;
    case 'fives':     chips += effDice.filter(d=>d===5).reduce((a,b)=>a+b,0)*5; break;
    case 'sixes':     chips += effDice.filter(d=>d===6).reduce((a,b)=>a+b,0)*5; break;
    case 'threeKind': chips += sum; break;
    case 'fourKind':  chips += sum; break;
  }

  const boost = G.comboBoosts[id];
  if (boost) { chips += boost.chips; mult += boost.mult; }
  if (G.oracleActive) mult += 2;

  const keptCount = G.kept.filter(Boolean).length;
  const steps = preview ? null : [{ type:'base', chips, mult }];

  G.jokers.forEach((j, jIdx) => {
    if (G.parasiteIdx === jIdx) return; // neutralisé par Le Parasite
    const c0 = chips, m0 = mult;
    [chips, mult] = j.apply(id, chips, mult, effDice, keptCount, j);
    // Modificateur appliqué immédiatement après le joker (l'ordre compte ici aussi)
    if (j.modifier && !j.modifier.isPhantom) [chips, mult] = j.modifier.apply(chips, mult);
    if (steps && (chips !== c0 || mult !== m0)) {
      steps.push({ type:'joker', jIdx, icon:j.icon ?? '🃏', name:jn(j), chips, mult, dChips:chips-c0, dMult:mult-m0 });
    }
  });

  let total = chips * mult;
  if (G.doubleNext) {
    total *= 2;
    if (!preview) G.doubleNext = false;
  }
  if (steps) steps.push({ type:'final', chips, mult, total });

  return { chips, mult, total, steps: steps || [] };
}

function getComboResult(id, preview = false) {
  if (G.bossEffect === 'noFullHouse' && id === 'fullHouse') return null;
  const eff = getEffDice();
  if (!isComboValid(id, eff)) return null;
  return computeScore(id, eff, preview);
}
