'use strict';

// ══════════════════════════════════════════════════════════════════
//  GAME — démarrage, blinds, header, dés, lancer, combos, fin de run
// ══════════════════════════════════════════════════════════════════

// ── Démarrage ─────────────────────────────────────────────────────
document.getElementById('btnStart').addEventListener('click', () => {
  startMusic();
  const inp = document.getElementById('seedInput');
  const s   = inp?.value.trim().toUpperCase() || '';
  resetGame(s || undefined);
  inp && (inp.value = '');
  showBlindIntro();
});
document.getElementById('btnRestart').addEventListener('click',    () => { startMusic(); resetGame(); showBlindIntro(); });
document.getElementById('btnWinRestart').addEventListener('click', () => { startMusic(); resetGame(); showBlindIntro(); });

// ══ HOLD R — RESTART ══
(function() {
  const HOLD_MS = 2500;
  let holdTimer = null;
  let startTime = null;

  const panel = document.getElementById('holdRestart');
  const fill  = document.getElementById('holdRestartFill');

  function startHold() {
    if (holdTimer) return;
    panel.classList.remove('hidden');
    fill.style.transitionDuration = '0ms';
    fill.style.width = '0%';
    requestAnimationFrame(() => {
      fill.style.transitionDuration = HOLD_MS + 'ms';
      fill.style.width = '100%';
    });
    startTime = performance.now();
    holdTimer = setTimeout(() => {
      cancelHold(false);
      startMusic(); resetGame(); showBlindIntro();
    }, HOLD_MS);
  }

  function cancelHold(reset = true) {
    if (!holdTimer) return;
    clearTimeout(holdTimer);
    holdTimer = null;
    startTime = null;
    if (reset) {
      fill.style.transitionDuration = '150ms';
      fill.style.width = '0%';
      setTimeout(() => panel.classList.add('hidden'), 160);
    } else {
      panel.classList.add('hidden');
    }
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'r' || e.key === 'R') { if (!e.repeat) startHold(); }
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'r' || e.key === 'R') cancelHold();
  });
})();

// ── Annonce de blind ──────────────────────────────────────────────
function showBlindIntro() {
  const isBoss = G.blindIdx === 2;
  const boss   = isBoss ? G.bossOrder[(G.ante - 1) % G.bossOrder.length] : null;
  const baseT  = ANTE_TARGETS[G.ante - 1]?.[G.blindIdx] ?? 999999;

  G.target     = (isBoss && boss?.effect === 'bigTarget') ? Math.round(baseT * 1.8) : baseT;
  G.bossEffect = isBoss ? boss?.effect ?? null : null;
  G.bannedValue = G.bossEffect === 'ban1' ? rand(1, 6) : null;

  const labels = [t('smallBlind'), t('bigBlind'), t('bossBlind')];
  const bossIconHtml = boss?.img ? `<img src="${boss.img}" class="card-art" alt="" style="max-height:60px">` : (boss?.icon ?? '💀');
  const icons  = ['<i class="fa-solid fa-bullseye"></i>', '<i class="fa-solid fa-trophy"></i>', bossIconHtml];
  const names  = [t('blindNameSmall', {n:G.ante}), t('blindNameBig', {n:G.ante}), boss ? jn(boss) : '???'];

  document.getElementById('biLabel').textContent  = labels[G.blindIdx];
  document.getElementById('biLabel').className    = 'bi-label' + (isBoss ? ' boss-label' : '');
  document.getElementById('biIcon').innerHTML      = icons[G.blindIdx];
  document.getElementById('biName').textContent   = names[G.blindIdx];
  document.getElementById('biTarget').textContent = nf(G.target);
  document.getElementById('biHands').textContent  = BASE_HANDS;

  const effectBox = document.getElementById('biEffectBox');
  if (isBoss && boss) {
    effectBox.classList.remove('hidden');
    document.getElementById('biEffectText').textContent =
      boss.effect === 'ban1' ? t('ban1Effect', {v:G.bannedValue}) : jd(boss);
    document.getElementById('blindIntroCard').classList.add('boss-card');
  } else {
    effectBox.classList.add('hidden');
    document.getElementById('blindIntroCard').classList.remove('boss-card');
  }

  showScreen('screenBlindIntro');
}

document.getElementById('btnPlayBlind').addEventListener('click', startBlind);

function startBlind() {
  G.score      = 0;
  G.handsLeft  = BASE_HANDS;
  G.rollsLeft  = getMaxRolls();
  G.hasRolled  = false;
  const n      = getDiceCount();
  G.dice       = Array(n).fill(1);
  G.kept       = Array(n).fill(false);
  G.doubleNext  = false;
  G.wildPending = false;
  G.parasiteIdx = null;

  showScreen('screenGame');
  renderHeader();
  renderDice();
  renderCombos();
  renderSidePanel();
  updateRollBtn();
  updateHint(t('hintStart'));

  document.getElementById('hspCombo').textContent   = '—';
  document.getElementById('hspFormula').innerHTML   = '';
}

function getMaxRolls() {
  let r = BASE_ROLLS;
  if (G.bossEffect === 'lessRoll') r = Math.max(1, r - 1);
  r += G.jokers.filter(j => j.id === 'relanceur').length;
  r += G.jokers.filter(j => j.id === 'marathonien').length * 2;
  return r;
}

function getDiceCount() {
  return 5 + G.jokers.filter(j => j.id === 'imbattable').length;
}

// ══════════════════════════════════════════════════════════════════
//  HEADER
// ══════════════════════════════════════════════════════════════════
function renderHeader() {
  document.getElementById('anteVal').textContent = G.ante;
  const isBoss = G.blindIdx === 2;
  const tag    = document.getElementById('blindTag');
  tag.textContent = [t('smallBlind'),t('bigBlind'),t('bossBlind')][G.blindIdx];
  tag.className   = 'blind-tag' + (isBoss ? ' boss' : '');

  const boss = isBoss ? G.bossOrder[(G.ante - 1) % G.bossOrder.length] : null;
  document.getElementById('blindEffectMini').textContent = boss ? `⚠️ ${jn(boss)}` : '';

  // Bannière boss : portrait + nom + effet directement sur l'écran de jeu
  const banner = document.getElementById('bossBanner');
  if (banner) {
    if (boss) {
      const img = document.getElementById('bossBannerImg');
      if (boss.img) { img.src = boss.img; img.style.display = ''; } else { img.style.display = 'none'; }
      document.getElementById('bossBannerName').textContent = jn(boss);
      document.getElementById('bossBannerEffect').textContent =
        boss.effect === 'ban1' ? t('ban1Effect', {v: G.bannedValue}) : jd(boss);
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }

  renderScore();
  renderPips();
}

function renderScore() {
  const cur = document.getElementById('scoreCurrent');
  cur.textContent = nf(G.score);
  cur.classList.toggle('beat', G.score >= G.target);
  document.getElementById('scoreTarget').textContent = nf(G.target);
  const pct = Math.min(100, (G.score / G.target) * 100);
  document.getElementById('scoreBarFill').style.width = pct + '%';
}

function renderPips() {
  const maxH = BASE_HANDS;
  const maxR = getMaxRolls();
  const hp   = document.getElementById('handsPips');
  const rp   = document.getElementById('rollsPips');

  const prevH = hp.querySelectorAll('.pip.hand-avail').length;
  const prevR = rp.querySelectorAll('.pip.roll-avail').length;

  hp.innerHTML = '';
  rp.innerHTML = '';

  const hCount = document.createElement('span');
  hCount.className = 'pip-count hand-count';
  hCount.textContent = `${G.handsLeft}/${maxH}`;
  hp.appendChild(hCount);

  for (let i = 0; i < maxH; i++) {
    const p = document.createElement('div');
    const avail = i < G.handsLeft;
    p.className = 'pip ' + (avail ? 'hand-avail' : 'hand-used');
    if (!avail && i === G.handsLeft && prevH > G.handsLeft) p.classList.add('pip-pop');
    hp.appendChild(p);
  }

  const rCount = document.createElement('span');
  rCount.className = 'pip-count roll-count';
  rCount.textContent = `${G.rollsLeft}/${maxR}`;
  rp.appendChild(rCount);

  for (let i = 0; i < maxR; i++) {
    const p = document.createElement('div');
    const avail = i < G.rollsLeft;
    p.className = 'pip ' + (avail ? 'roll-avail' : 'roll-used');
    if (!avail && i === G.rollsLeft && prevR > G.rollsLeft) p.classList.add('pip-pop');
    rp.appendChild(p);
  }
}

// ══════════════════════════════════════════════════════════════════
//  DÉS
// ══════════════════════════════════════════════════════════════════
function isBanned(i) {
  return G.hasRolled && G.bossEffect === 'ban1' && G.bannedValue !== null && G.dice[i] === G.bannedValue;
}

function renderDice() {
  const fogActive = G.bossEffect === 'fog';
  document.getElementById('fogOverlay')?.classList.toggle('hidden', !fogActive);
  const row = document.getElementById('diceRow');
  row.innerHTML = '';
  for (let i = 0; i < G.dice.length; i++) {
    const die = document.createElement('div');
    die.className = 'die' +
      (G.kept[i]    ? ' kept'        : '') +
      (!G.hasRolled ? ' die-disabled' : '') +
      (isBanned(i)  ? ' banned'       : '');
    if (G.kept[i]) die.dataset.keptlabel = t('keptLabel');
    if (fogActive && G.hasRolled) {
      renderFogMark(die);
    } else {
      renderDots(die, G.dice[i]);
    }
    die.addEventListener('click', () => handleDieClick(i));
    row.appendChild(die);
  }
}

function renderFogMark(el) {
  el.querySelectorAll('.dot, .fog-mark').forEach(d => d.remove());
  const span = document.createElement('span');
  span.className = 'fog-mark';
  span.textContent = '?';
  el.appendChild(span);
}

function renderDots(el, val) {
  el.querySelectorAll('.dot').forEach(d => d.remove());
  const pos = DOT_POSITIONS[val] || DOT_POSITIONS[1];
  pos.forEach(([l, t]) => {
    const d = document.createElement('div');
    d.className = 'dot';
    d.style.left = l + '%';
    d.style.top  = t + '%';
    el.appendChild(d);
  });
}

function handleDieClick(i) {
  if (!G.hasRolled || G.rolling || G.scoring) return;
  if (G.wildPending) { showWildPicker(i); return; }
  if (isBanned(i)) return;
  G.kept[i] = !G.kept[i];
  renderDice();
}

// ══════════════════════════════════════════════════════════════════
//  LANCER
// ══════════════════════════════════════════════════════════════════
document.getElementById('btnRoll').addEventListener('click', rollDice);
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const btn = document.getElementById('btnRoll');
    if (!btn.disabled && btn.offsetParent !== null) btn.click();
  }
});

async function rollDice() {
  if (G.rollsLeft <= 0 || G.rolling) return;
  G.rolling   = true;
  G.rollsLeft--;
  G.hasRolled = true;

  // Boss Parasite : neutralise un joker non-fantôme aléatoire
  if (G.bossEffect === 'parasite') {
    const eligible = G.jokers.map((j, i) => i).filter(i => !G.jokers[i].modifier?.isPhantom);
    G.parasiteIdx = eligible.length > 0 ? eligible[Math.floor(Math.random() * eligible.length)] : null;
    if (G.parasiteIdx !== null) {
      const j = G.jokers[G.parasiteIdx];
      toast(t('parasiteNeutralized', {name: jn(j)}), '#a855f7');
    }
    renderSidePanel();
  }

  renderPips();
  updateRollBtn();
  playRollSound();

  const dieEls  = document.querySelectorAll('#diceRow .die');
  const VARIANTS = ['roll-v1','roll-v2','roll-v3'];
  const fogActive = G.bossEffect === 'fog';

  // Tous les dés non-gardés animent (y compris ceux qui seront bannis — on ne sait pas encore)
  dieEls.forEach((el, i) => {
    if (G.kept[i]) return;
    const v = VARIANTS[rand(0,2)];
    el.classList.add(v);
    el.dataset.rv = v;
  });

  const DURATION = 700;
  const INTERVAL = 55;
  const frames   = Math.floor(DURATION / INTERVAL) - 2;

  for (let f = 0; f < frames; f++) {
    dieEls.forEach((el, i) => {
      if (G.kept[i]) return;
      if (!fogActive) renderDots(el, rand(1,6));
    });
    await sleep(INTERVAL);
  }

  // Tirage des valeurs finales
  G.dice.forEach((_, i) => { if (!G.kept[i]) G.dice[i] = rand(1,6); });

  // Retrait des classes d'animation + affichage immédiat des valeurs finales
  dieEls.forEach((el, i) => {
    const v = el.dataset.rv;
    if (v) { el.classList.remove(v); delete el.dataset.rv; }
    if (!G.kept[i] && !fogActive) renderDots(el, G.dice[i]);
  });

  await sleep(INTERVAL * 2);

  // Landing uniquement sur les dés non-gardés et non-bannis (avec les nouvelles valeurs)
  dieEls.forEach((el, i) => {
    if (G.kept[i] || isBanned(i)) return;
    el.classList.add('landing');
  });

  await sleep(360); // durée de l'animation landing

  G.rolling = false;

  // Boss Parasite : réactive le joker neutralisé
  if (G.bossEffect === 'parasite' && G.parasiteIdx !== null) {
    G.parasiteIdx = null;
    renderSidePanel();
  }

  renderDice(); // rebuild complet — applique .banned avec les nouvelles valeurs
  updateRollBtn();
  renderPreviewPanel();

  if (G.rollsLeft === 0) updateHint(t('hintNoRolls'));
  else if (G.rollsLeft === 1) updateHint(t('hintLast'));
  else updateHint(t('hintKeep'));
}

function updateRollBtn() {
  const btn   = document.getElementById('btnRoll');
  const label = document.getElementById('btnRollLabel');
  if (!G.hasRolled) {
    btn.disabled      = false;
    label.textContent = t('rollDiceBtn');
  } else if (G.rollsLeft <= 0) {
    btn.disabled      = true;
    label.textContent = t('noRolls');
  } else {
    btn.disabled      = G.rolling;
    label.textContent = G.rollsLeft === 1 ? t('lastRoll') : t('rerollBtn', {n:G.rollsLeft});
  }
}

function updateHint(txt) { document.getElementById('diceHint').textContent = txt; }

// ══════════════════════════════════════════════════════════════════
//  PANEL COMBOS + PRÉVIEW
// ══════════════════════════════════════════════════════════════════
function renderPreviewPanel() {
  renderCombos();

  // La Brume : ne rien révéler avant la soumission
  if (G.bossEffect === 'fog' && !G.scoring) {
    document.getElementById('hspCombo').textContent = '🌫️ ???';
    document.getElementById('hspFormula').innerHTML = '';
    return;
  }

  let bestRes = null, bestName = '';
  COMBOS.forEach(cat => {
    const res = getComboResult(cat.id, true); // preview=true, ne consomme pas doubleNext
    if (res && (!bestRes || res.total > bestRes.total)) { bestRes = res; bestName = jn(cat); }
  });

  document.getElementById('hspCombo').textContent = bestRes ? bestName : t('noCombo');
  if (bestRes) {
    document.getElementById('hspFormula').innerHTML =
      `<span class="hsp-chips">${bestRes.chips}</span>` +
      `<span class="hsp-x">×</span>` +
      `<span class="hsp-mult">${bestRes.mult}</span>` +
      `<span class="hsp-eq">=</span>` +
      `<span class="hsp-total">${nf(bestRes.total)} ${t('pts')}</span>`;
  } else {
    document.getElementById('hspFormula').innerHTML = '';
  }
}

function renderCombos() {
  const grid = document.getElementById('combosGrid');
  grid.innerHTML = '';
  if (!G.hasRolled) return;

  let bestTotal = 0;
  const results = COMBOS.map(cat => {
    const blocked = G.bossEffect === 'noFullHouse' && cat.id === 'fullHouse';
    const res     = !blocked ? getComboResult(cat.id, true) : null; // preview
    if (res && res.total > bestTotal) bestTotal = res.total;
    return { cat, res, blocked };
  });

  // La Brume : les valeurs des combos sont masquées (sinon elles trahissent les dés)
  const fogHidden = G.bossEffect === 'fog' && !G.scoring;

  results.forEach(({ cat, res, blocked }) => {
    const btn = document.createElement('button');
    btn.className = 'combo-btn' +
      (blocked              ? ' blocked'  : '') +
      (!res && !blocked     ? ' disabled' : '') +
      (!fogHidden && res && res.total === bestTotal && bestTotal > 0 ? ' best' : '');

    const boost = G.comboBoosts[cat.id];
    const star  = boost ? `<span class="cb-star" title="+${boost.chips} Chips +${boost.mult} Mult">★</span>` : '';
    btn.innerHTML = `<span class="cb-name">${jn(cat)}${star}</span>` + (res
      ? (fogHidden
        ? `<span class="cb-total" style="color:var(--grey)">= ? ${t('pts')}</span>`
        : `<span class="cb-chips">${res.chips} ${t('chips')}</span><span class="cb-mult">× ${res.mult} ${t('mult')}</span><span class="cb-total">= ${nf(res.total)} ${t('pts')}</span>`)
      : `<span class="cb-total" style="color:var(--grey)">—</span>`);

    if (res && !blocked) btn.addEventListener('click', () => playCombo(cat.id));
    grid.appendChild(btn);
  });
}

// ══════════════════════════════════════════════════════════════════
//  JOUER UNE COMBINAISON
// ══════════════════════════════════════════════════════════════════
async function playCombo(id) {
  if (!G.hasRolled || G.scoring) return;
  const res = getComboResult(id, false);
  if (!res) return;

  G.scoring = true;

  if (G.bossEffect === 'fog') { renderDice(); renderCombos(); }

  if (res.steps.length > 1) await animateCombo(res.steps);

  G.scoring = false;
  G.score    += res.total;
  G.handsLeft--;
  G.runHands++;
  G.runScore += res.total;
  if (id === 'yahtzee') G.runYahtzees++;

  playScoreSound();
  showScorePopup(`+${nf(res.total)}`);
  toast(t('comboPlayed', {name: cn(id), score: nf(res.total)}), 'gold');
  if (id === 'yahtzee') spawnComboParticles('yahtzee');
  else if (res.total >= 2000) spawnComboParticles('legendary');
  G.jokers.forEach(j => { if (j.onCombo) j.onCombo(id, G.dice, j); });

  renderScore();
  renderSidePanel();

  if (G.score >= G.target) { setTimeout(winBlind, 600); return; }
  if (G.handsLeft <= 0)    { setTimeout(loseGame, 600); return; }

  const n2     = getDiceCount();
  G.dice       = Array(n2).fill(1);
  G.kept       = Array(n2).fill(false);
  G.rollsLeft   = getMaxRolls();
  G.hasRolled   = false;
  G.wildPending = false;
  G.oracleActive= false;

  document.getElementById('hspCombo').textContent   = '—';
  document.getElementById('hspFormula').innerHTML   = '';

  renderDice();
  renderPips();
  updateRollBtn();
  renderCombos();
  updateHint(t('hintStart'));
}

// ══════════════════════════════════════════════════════════════════
//  FIN DE BLIND / GAME OVER / WIN
// ══════════════════════════════════════════════════════════════════
function winBlind() {
  toast(t('blindBeaten'), 'green');
  G.gold += 4;
  G.jokers.forEach(j => { if (j.onWinBlind) j.onWinBlind(j); });
  openShop();
}

function loseGame() {
  document.getElementById('goSub').textContent =
    t('gameOverSub', {target: nf(G.target), score: nf(G.score)});
  document.getElementById('goStats').textContent =
    `${t('statsAnte')}: ${G.ante}\n${t('statsHands')}: ${G.runHands}\n${t('statsRunScore')}: ${nf(G.runScore)}\n${t('statsYahtzees')}: ${G.runYahtzees}`;
  showScreen('screenGameOver');
}

function showWin() {
  document.getElementById('winStats').textContent =
    `${t('statsAntesDone')}: 5\n${t('statsHands')}: ${G.runHands}\n${t('statsRunScore')}: ${nf(G.runScore)}\n${t('statsYahtzees')}: ${G.runYahtzees}\n${t('statsJokersLabel')}: ${G.jokers.map(j=>jn(j)).join(', ')||t('none')}`;
  showScreen('screenWin');
}
