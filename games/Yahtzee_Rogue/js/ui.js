'use strict';

// ══════════════════════════════════════════════════════════════════
//  UI — icônes cartes, tooltips, side panel, consommables, toasts,
//  particules, encyclopédie, thème/langue/volume
// ══════════════════════════════════════════════════════════════════
function jicon(o) {
  if (o && o.img) return `<img src="${o.img}" class="card-art" alt="" loading="lazy">`;
  return o && o.fa ? '<i class="' + o.fa + '"></i>' : (o && o.icon ? o.icon : '');
}
function modIconBadge(m) { return m ? '<span class="mod-badge" style="color:' + m.color + '">' + m.icon + '</span>' : ''; }
function modTipHTML(m) { return m ? '<div class="mod-tip" style="--mc:' + m.color + '"><b>' + m.icon + ' ' + modLabel(m) + '</b><span>' + modifierDesc(m.id) + '</span></div>' : ''; }
// Infobulle joker : image + nom + effet, révélée au survol de la carte
function jokerTipHTML(j) {
  if (!j) return '';
  const art = j.img ? `<div class="jt-art">${jicon(j)}</div>` : '';
  const effMod = j.modifier || (j.phantom ? { id:'phantom', icon:'👻', color:'#b39ddb' } : null);
  const mod = effMod
    ? `<div class="jt-mod" style="--mc:${effMod.color}"><b>${effMod.icon} ${modLabel(effMod)}</b><span>${modifierDesc(effMod.id)}</span></div>`
    : '';
  return `<div class="joker-tip" data-rarity="${j.rarity || 'common'}">
    ${art}
    <div class="jt-body">
      <div class="jt-name">${jn(j)}</div>
      <div class="jt-rar">${rarityLabel(j.rarity)}</div>
      ${mod}
      <div class="jt-desc">${jdc(j)}</div>
    </div>
  </div>`;
}
// Positionne l'infobulle joker en position:fixed au survol → au-dessus de tout,
// jamais rognée par un conteneur ni un autre élément.
(function initJokerTipPositioning() {
  function place(card) {
    const tip = card.querySelector(':scope > .joker-tip');
    if (!tip) return;
    // Portée dans <body> : évite que le hover-transform de la carte (containing
    // block créé par translateY) ne fausse le positionnement fixed de la bulle.
    if (tip.parentElement !== document.body) {
      tip._homeCard = card;
      document.body.appendChild(tip);
    }
    const panel = document.getElementById('jokersSlot') || card.parentElement;
    const pr = panel.getBoundingClientRect();
    const cr = card.getBoundingClientRect();
    const tw = tip.offsetWidth  || 216;
    const th = tip.offsetHeight || 110;
    // à droite du panneau de jokers (jamais sur une autre carte), aligné sur la carte survolée
    let left = pr.right + 12;
    const flip = left + tw > window.innerWidth - 8;
    if (flip) left = cr.left - 12 - tw;
    let top = cr.top + cr.height / 2;
    top = Math.max(8 + th / 2, Math.min(top, window.innerHeight - 8 - th / 2));
    tip.classList.toggle('flip', flip);
    tip.style.left = left + 'px';
    tip.style.top  = top + 'px';
    tip.style.transform = 'translateY(-50%)';
    tip.style.opacity = '1';
  }
  function clear(card) {
    const tip = (card.querySelector(':scope > .joker-tip')) ||
                [...document.querySelectorAll('body > .joker-tip')].find(t => t._homeCard === card);
    if (!tip) return;
    tip.style.opacity = '0';
    if (tip._homeCard === card) card.appendChild(tip);
    tip.style.left = tip.style.top = tip.style.transform = '';
    tip.classList.remove('flip');
  }
  document.addEventListener('mouseover', e => {
    const card = e.target.closest && e.target.closest('.panel-card[data-rarity]');
    if (card && (card.querySelector(':scope > .joker-tip') || [...document.querySelectorAll('body > .joker-tip')].some(t => t._homeCard === card))) place(card);
  });
  document.addEventListener('mouseout', e => {
    const card = e.target.closest && e.target.closest('.panel-card[data-rarity]');
    if (card && !card.contains(e.relatedTarget)) clear(card);
  });
})();

// ══════════════════════════════════════════════════════════════════
//  FORMULE + ANIMATION DE SCORE
// ══════════════════════════════════════════════════════════════════
function setHspFormula(chips, mult, total = null) {
  document.getElementById('hspFormula').innerHTML =
    `<span class="hsp-chips">${chips}</span>` +
    `<span class="hsp-x">×</span>` +
    `<span class="hsp-mult">${mult}</span>` +
    (total !== null
      ? `<span class="hsp-eq">=</span><span class="hsp-total">${nf(total)} ${t('pts')}</span>`
      : '');
}

function highlightJokerCard(jIdx) {
  const el = document.querySelector(`.panel-card[data-joker-idx="${jIdx}"]`);
  if (el) { el.classList.add('joker-active'); el.scrollIntoView({ block:'nearest', behavior:'smooth' }); }
}
function unhighlightJokerCard(jIdx) {
  const el = document.querySelector(`.panel-card[data-joker-idx="${jIdx}"]`);
  if (el) el.classList.remove('joker-active');
}

async function animateCombo(steps) {
  const comboEl = document.getElementById('hspCombo');
  const jokerEl = document.getElementById('hspJokerLine');
  for (const step of steps) {
    if (step.type === 'base') {
      comboEl.textContent = t('calcScore');
      if (jokerEl) jokerEl.textContent = '';
      setHspFormula(step.chips, step.mult);
      await sleep(220);
    } else if (step.type === 'joker') {
      highlightJokerCard(step.jIdx);
      comboEl.textContent = `${step.icon} ${step.name}`;
      const parts = [];
      if (step.dChips > 0) parts.push(`+${step.dChips} ${t('chips')}`);
      if (step.dChips < 0) parts.push(`${step.dChips} ${t('chips')}`);
      if (step.dMult  > 0) parts.push(`+${step.dMult} ${t('mult')}`);
      if (step.dMult  < 0) parts.push(`${step.dMult} ${t('mult')}`);
      if (jokerEl) jokerEl.textContent = parts.join('  ·  ');
      setHspFormula(step.chips, step.mult);
      await sleep(420);
      unhighlightJokerCard(step.jIdx);
    } else if (step.type === 'final') {
      comboEl.textContent = t('finalScore');
      if (jokerEl) jokerEl.textContent = '';
      setHspFormula(step.chips, step.mult, step.total);
      await sleep(250);
    }
  }
}

// ══════════════════════════════════════════════════════════════════
//  DRAG & DROP JOKERS
// ══════════════════════════════════════════════════════════════════
// Réordonne par insertion (drag & drop) : déplace le joker du slot fromSlot
// vers la position toSlot parmi les jokers normaux, en préservant les fantômes.
function reorderJoker(fromSlot, toSlot) {
  const slots = G.jokers.map((j,i) => ({ j, i })).filter(x => !x.j.phantom);
  if (fromSlot < 0 || fromSlot >= slots.length) return;
  toSlot = Math.max(0, Math.min(toSlot, slots.length - 1));
  if (fromSlot === toSlot) return;
  const positions = slots.map(x => x.i);
  const order = slots.map(x => x.j);
  const [moved] = order.splice(fromSlot, 1);
  order.splice(toSlot, 0, moved);
  positions.forEach((gi, k) => { G.jokers[gi] = order[k]; });
  renderSidePanel();
}

let _dragSlot = null;
function attachJokerDnD(el, slot, isEnd) {
  if (!isEnd) {
    el.addEventListener('dragstart', e => {
      _dragSlot = slot;
      el.classList.add('dragging');
      try { e.dataTransfer.setData('text/plain', String(slot)); e.dataTransfer.effectAllowed = 'move'; } catch (err) {}
    });
    el.addEventListener('dragend', () => {
      _dragSlot = null;
      document.querySelectorAll('.joker-draggable, .empty-slot').forEach(c => c.classList.remove('dragging','drop-before','drop-after','drop-into'));
    });
  }
  el.addEventListener('dragover', e => {
    if (_dragSlot === null) return;
    e.preventDefault();
    try { e.dataTransfer.dropEffect = 'move'; } catch (err) {}
    if (isEnd) { el.classList.add('drop-into'); return; }
    if (slot === _dragSlot) return;
    const r = el.getBoundingClientRect();
    const after = e.clientX > r.left + r.width / 2;
    el.classList.toggle('drop-after', after);
    el.classList.toggle('drop-before', !after);
  });
  el.addEventListener('dragleave', () => el.classList.remove('drop-before','drop-after','drop-into'));
  el.addEventListener('drop', e => {
    if (_dragSlot === null) return;
    e.preventDefault();
    const from = _dragSlot;
    el.classList.remove('drop-before','drop-after','drop-into');
    if (isEnd) { reorderJoker(from, 1e9); return; }
    if (slot === from) return;
    const r = el.getBoundingClientRect();
    const after = e.clientX > r.left + r.width / 2;
    let desired = slot + (after ? 1 : 0);
    if (from < desired) desired -= 1;
    reorderJoker(from, desired);
  });
}

function moveJoker(gIdx, dir) {
  const normal = G.jokers.map((j,i) => ({ j, i })).filter(x => !x.j.phantom);
  const slot   = normal.findIndex(x => x.i === gIdx);
  const target = slot + dir;
  if (target < 0 || target >= normal.length) return;
  const tIdx = normal[target].i;
  [G.jokers[gIdx], G.jokers[tIdx]] = [G.jokers[tIdx], G.jokers[gIdx]];
  renderSidePanel();
}

// ══════════════════════════════════════════════════════════════════
//  PANEL LATÉRAL (jokers, consommables, stats)
// ══════════════════════════════════════════════════════════════════
function renderSidePanel() {
  // Nettoie les infobulles jokers éventuellement encore portées dans <body>
  document.querySelectorAll('body > .joker-tip').forEach(t => t.remove());
  // ── Jokers (slots visuels) ──────────────────────────────────────
  const js = document.getElementById('jokersSlot');
  js.innerHTML = '';
  const normalJokers  = G.jokers.filter(j => !j.phantom);
  const phantomJokers = G.jokers.filter(j =>  j.phantom);

  // Label avec compteur
  const jLabel = js.closest('.col-side').querySelector('.panel-label');
  if (jLabel) jLabel.textContent = t('jokersCount', {n: normalJokers.length, max: getMaxJokers()});

  const jGrid = document.createElement('div');
  jGrid.className = 'slot-grid';
  const normalWithIdx = G.jokers.map((j,i) => ({ j, i })).filter(x => !x.j.phantom);
  for (let slot = 0; slot < getMaxJokers(); slot++) {
    const item = normalWithIdx[slot];
    const div  = document.createElement('div');
    if (item) {
      const { j, i: gIdx } = item;
      div.className = 'panel-card joker-draggable' + (G.parasiteIdx === gIdx ? ' parasited' : '');
      div.draggable = true;
      div.dataset.slot = slot;
      div.dataset.rarity    = j.rarity || 'common';
      if (j.modifier) div.dataset.modifier = j.modifier.id;
      div.dataset.jokerIdx  = gIdx;
      div.innerHTML = `
        ${j.modifier ? `<div class="pc-mod" style="color:${j.modifier.color}">${j.modifier.icon}</div>` : ''}
        ${j.hands != null ? `<div class="pc-hands" title="${t('handsLeftBadge', {n: j.hands})}">⏳${j.hands}</div>` : ''}
        <div class="pc-icon">${jicon(j)}</div>
        <div class="pc-name">${jn(j)}</div>
        <div class="pc-rar">${rarityLabel(j.rarity)}</div>
        <div class="pc-desc">${jdc(j)}</div>`;
      div.insertAdjacentHTML('beforeend', jokerTipHTML(j));
      attachJokerDnD(div, slot);
    } else {
      div.className = 'panel-card empty-slot';
      div.innerHTML = '<div class="es-label">+</div>';
      attachJokerDnD(div, normalWithIdx.length - 1, true);
    }
    jGrid.appendChild(div);
  }
  js.appendChild(jGrid);

  // Jokers fantômes (section séparée)
  if (phantomJokers.length) {
    const ph = document.createElement('div');
    ph.className = 'phantom-section';
    ph.innerHTML = `<div class="phantom-label">${t('phantoms')}</div>`;
    const pg = document.createElement('div');
    pg.className = 'slot-grid';
    phantomJokers.forEach(j => {
      const div = document.createElement('div');
      div.className = 'panel-card phantom';
      div.dataset.rarity = j.rarity || 'common';
      div.dataset.modifier = (j.modifier && j.modifier.id) || 'phantom';
      div.innerHTML = `
        <div class="pc-icon">${jicon(j)}</div>
        <div class="pc-name">${jn(j)}</div>
        <div class="pc-rar">${rarityLabel(j.rarity)}</div>`;
      div.insertAdjacentHTML('beforeend', jokerTipHTML(j));
      pg.appendChild(div);
    });
    ph.appendChild(pg);
    js.appendChild(ph);
  }

  // ── Consommables (slots visuels) ────────────────────────────────
  const cs = document.getElementById('consumablesSlot');
  cs.innerHTML = '';

  const cGrid = document.createElement('div');
  cGrid.className = 'slot-grid cons-grid';
  for (let i = 0; i < MAX_CONSUMABLES; i++) {
    const c   = G.consumables[i];
    const div = document.createElement('div');
    if (c) {
      div.className = 'panel-card cons-card';
      div.innerHTML = `<div class="pc-icon">${jicon(c)}</div><div class="pc-name">${jn(c)}</div><div class="pc-desc">${jdc(c)}</div>`;
      div.style.cursor = 'pointer';
      div.title = t('clickToUse');
      div.addEventListener('click', () => useConsumable(c, i));
    } else {
      div.className = 'panel-card empty-slot';
      div.innerHTML = '<div class="es-label">+</div>';
    }
    cGrid.appendChild(div);
  }
  cs.appendChild(cGrid);

  // ── Or + stats ──────────────────────────────────────────────────
  document.getElementById('goldDisplay').textContent = G.gold;
  document.getElementById('runStats').innerHTML =
    t('runStats', {seed: G.seed, h: G.runHands, y: G.runYahtzees, s: nf(G.runScore)});
}

// ══════════════════════════════════════════════════════════════════
//  CONSOMMABLES
// ══════════════════════════════════════════════════════════════════
function useConsumable(c, idx) {
  switch (c.type) {
    case 'wild':
      G.wildPending = true;
      toast(t('wildHint'), 'green');
      return;
    case 'roll':
      G.rollsLeft++;
      renderPips();
      updateRollBtn();
      toast(t('freeRoll'), 'gold');
      break;
    case 'double':
      G.doubleNext = true;
      toast(t('doubleCombo'), 'gold');
      break;
    case 'oracle':
      G.oracleActive = true;
      toast(t('oracleActive'), 'gold');
      break;
    case 'acceleration':
      G.target = Math.max(1, Math.round(G.target * 0.8));
      renderScore();
      toast(t('targetReduced', {t: nf(G.target)}), 'green');
      break;
  }
  G.consumables.splice(idx, 1);
  renderSidePanel();
}

function showWildPicker(dieIdx) {
  document.querySelector('.wild-picker')?.remove();
  const picker = document.createElement('div');
  picker.className = 'wild-picker';
  picker.style.cssText =
    'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:300;' +
    'background:var(--bg-2);border:1px solid var(--border-2);border-radius:14px;' +
    'padding:1.25rem;display:flex;gap:.6rem;box-shadow:0 20px 60px rgba(0,0,0,.7);';
  picker.innerHTML = `<span style="margin-right:.5rem;color:var(--grey-2);font-size:.85rem;align-self:center">${t('chooseValue')}</span>`;
  for (let v = 1; v <= 6; v++) {
    const btn = document.createElement('button');
    btn.textContent = v;
    btn.style.cssText =
      'width:40px;height:40px;border-radius:8px;border:1px solid var(--border-2);' +
      'background:var(--bg-3);color:var(--white);font-size:1.1rem;font-weight:700;cursor:pointer;';
    btn.addEventListener('click', () => {
      G.dice[dieIdx]  = v;
      G.wildPending   = false;
      const idx = G.consumables.findIndex(c => c.type === 'wild');
      if (idx >= 0) G.consumables.splice(idx, 1);
      renderDice();
      renderPreviewPanel();
      renderSidePanel();
      picker.remove();
      toast(t('wildChanged', {v}), 'green');
    });
    picker.appendChild(btn);
  }
  document.body.appendChild(picker);
  setTimeout(() => {
    function close(e) { if (!picker.contains(e.target)) { picker.remove(); G.wildPending = false; document.removeEventListener('click', close); } }
    document.addEventListener('click', close);
  }, 100);
}

// ══════════════════════════════════════════════════════════════════
//  SCORE POPUP + TOASTS + PARTICULES
// ══════════════════════════════════════════════════════════════════
function showScorePopup(txt) {
  const el   = document.createElement('div');
  el.className   = 'score-popup';
  el.textContent = txt;
  const ref  = document.getElementById('scoreCurrent');
  const rect = ref.getBoundingClientRect();
  el.style.left = rect.left + 'px';
  el.style.top  = rect.top  + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

function toast(msg, type = '') {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className   = 'toast' + (type ? ' ' + type : '');
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 2400);
}

function spawnStars(container) {
  for (let i = 0; i < 18; i++) {
    const star = document.createElement('div');
    star.className = 'burst-star';
    const angle = (i / 18) * 360;
    const dist  = 60 + Math.random() * 80;
    star.style.setProperty('--tx', `${Math.cos(angle * Math.PI/180) * dist}px`);
    star.style.setProperty('--ty', `${Math.sin(angle * Math.PI/180) * dist}px`);
    star.style.animationDelay = `${Math.random() * 200}ms`;
    star.textContent = ['⭐','✨','💫','🌟'][Math.floor(Math.random()*4)];
    container.appendChild(star);
    star.addEventListener('animationend', () => star.remove());
  }
}

function spawnComboParticles(type) {
  const colors = type === 'yahtzee'
    ? ['#ffc24b','#ffd887','#fff','#ffec8b','#ff5d8f']
    : ['#b3a6ff','#8b7bff','#fff','#46d6ff','#ffc24b'];
  const emojis = type === 'yahtzee'
    ? ['🎲','✨','⭐','💥','🎯']
    : ['💎','✨','🌟','💫','⚡'];
  const ref = document.getElementById('scoreCurrent');
  const rect = ref ? ref.getBoundingClientRect() : { left: window.innerWidth/2, top: window.innerHeight/2 };
  const cx = rect.left + rect.width/2;
  const cy = rect.top  + rect.height/2;
  const count = type === 'yahtzee' ? 32 : 18;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'combo-particle';
    const angle = Math.random() * 360;
    const dist  = 60 + Math.random() * 160;
    const tx    = Math.cos(angle * Math.PI/180) * dist;
    const ty    = Math.sin(angle * Math.PI/180) * dist - 40;
    p.style.cssText = `left:${cx}px;top:${cy}px;--tx:${tx}px;--ty:${ty}px;color:${colors[i % colors.length]};animation-delay:${Math.random()*150}ms;`;
    p.textContent = Math.random() < 0.5 ? emojis[Math.floor(Math.random()*emojis.length)] : '✦';
    document.body.appendChild(p);
    p.addEventListener('animationend', () => p.remove());
  }
}

// ══════════════════════════════════════════════════════════════════
//  LIBELLÉS MODIFICATEURS + RARETÉS
// ══════════════════════════════════════════════════════════════════
function modLabel(m) {
  const lm = { phantom:'mPhantom', golden:'mGolden', amplified:'mAmplified', lucky:'mLucky' };
  return m && lm[m.id] ? t(lm[m.id]) : (m ? m.label : '');
}
function modifierDesc(id) {
  const map = { phantom:'mdPhantom', golden:'mdGolden', amplified:'mdAmplified', lucky:'mdLucky' };
  return map[id] ? t(map[id]) : '';
}

function rarityLabel(r) {
  const map = {
    common:    `<span class="rl common">${t('rCommon')}</span>`,
    uncommon:  `<span class="rl uncommon">${t('rUncommon')}</span>`,
    rare:      `<span class="rl rare">${t('rRare')}</span>`,
    legendary: `<span class="rl legendary">${t('rLegendary')}</span>`,
  };
  return map[r] ?? map.common;
}

// ══════════════════════════════════════════════════════════════════
//  ENCYCLOPÉDIE
// ══════════════════════════════════════════════════════════════════
function openEncyclopedia() {
  let overlay = document.getElementById('encycloOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id        = 'encycloOverlay';
    overlay.className = 'encyclo-overlay';
    overlay.innerHTML = `
      <div class="encyclo-modal">
        <div class="encyclo-header">
          <h2>${t('encycloTitle')}</h2>
          <button class="encyclo-close" id="encycloClose">✕</button>
        </div>
        <div class="encyclo-tabs">
          <button class="etab active" data-tab="jokers">${t('tabJokers', {n: JOKER_POOL.length})}</button>
          <button class="etab" data-tab="consumables">${t('tabConsumables', {n: CONSUMABLE_POOL.length})}</button>
        </div>
        <div class="encyclo-body" id="encycloBody"></div>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('#encycloClose').addEventListener('click', () => overlay.classList.add('hidden'));
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.add('hidden'); });
    overlay.querySelectorAll('.etab').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('.etab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderEncycloTab(btn.dataset.tab);
      });
    });
  }
  overlay.classList.remove('hidden');
  renderEncycloTab('jokers');
}

function renderEncycloTab(tab) {
  const body = document.getElementById('encycloBody');
  body.innerHTML = '';

  if (tab === 'jokers') {
    const groups = [
      { key:'common',    label:t('gCommons') },
      { key:'uncommon',  label:t('gUncommons') },
      { key:'rare',      label:t('gRares') },
      { key:'legendary', label:t('gLegendaries') },
    ];
    groups.forEach(g => {
      const items = JOKER_POOL.filter(j => j.rarity === g.key);
      if (!items.length) return;
      const h = document.createElement('div');
      h.className = `encyclo-group-title ${g.key}`;
      h.textContent = g.label;
      body.appendChild(h);
      items.forEach(j => {
        const owned = G.jokers.some(gj => gj.id === j.id);
        const row = document.createElement('div');
        row.className = 'encyclo-row' + (owned ? ' owned' : '');
        row.dataset.rarity = j.rarity;
        row.innerHTML = `
          <span class="er-icon">${jicon(j)}</span>
          <div class="er-info">
            <span class="er-name">${jn(j)}</span>
            <span class="er-desc">${jdc(j)}</span>
          </div>
          <div class="er-meta">
            ${rarityLabel(j.rarity)}
            <span class="er-cost">💰 ${j.cost}</span>
            ${owned ? `<span class="er-owned">${t('owned')}</span>` : ''}
          </div>`;
        body.appendChild(row);
      });
    });
  } else {
    CONSUMABLE_POOL.forEach(c => {
      const row = document.createElement('div');
      row.className = 'encyclo-row';
      row.innerHTML = `
        <span class="er-icon">${jicon(c)}</span>
        <div class="er-info">
          <span class="er-name">${jn(c)}</span>
          <span class="er-desc">${jdc(c)}</span>
        </div>
        <div class="er-meta">
          <span style="color:var(--green);font-size:.75rem">${t('consumable')}</span>
          <span class="er-cost">💰 ${c.cost}</span>
        </div>`;
      body.appendChild(row);
    });
  }
}

document.getElementById('btnEncyclo')?.addEventListener('click', openEncyclopedia);

// ══════════════════════════════════════════════════════════════════
//  THÈME + LANGUE (toggles) + i18n bootstrap
// ══════════════════════════════════════════════════════════════════
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('rtd_theme', theme); } catch (e) {}
  document.querySelectorAll('#themeSeg .seg-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.themeVal === theme));
}

function refreshUI() {
  applyI18n();
  const id = visibleScreenId();
  if (id === 'screenBlindIntro') {
    if (G && G.bossOrder) showBlindIntro();
  } else if (id === 'screenGame') {
    renderHeader(); renderSidePanel(); renderDice();
    if (G.hasRolled) renderPreviewPanel(); else renderCombos();
    updateRollBtn();
    if (!G.hasRolled) updateHint(t('hintStart'));
    else if (G.rollsLeft === 0) updateHint(t('hintNoRolls'));
    else if (G.rollsLeft === 1) updateHint(t('hintLast'));
    else updateHint(t('hintKeep'));
  } else if (id === 'screenShop') {
    renderShop();
  } else if (id === 'screenGameOver') {
    loseGame();
  } else if (id === 'screenWin') {
    showWin();
  }
  const enc = document.getElementById('encycloOverlay');
  if (enc) { const wasOpen = !enc.classList.contains('hidden'); enc.remove(); if (wasOpen) openEncyclopedia(); }
}

function setLang(lang) {
  LANG = lang;
  try { localStorage.setItem('rtd_lang', lang); } catch (e) {}
  document.documentElement.lang = lang;
  document.querySelectorAll('#langSeg .seg-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.langVal === lang));
  refreshUI();
}

(function initControls() {
  let savedTheme = 'cobalt';
  try { savedTheme = localStorage.getItem('rtd_theme') || 'cobalt'; } catch (e) {}
  setTheme(savedTheme);
  document.documentElement.lang = LANG;
  document.querySelectorAll('#langSeg .seg-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.langVal === LANG));
  document.querySelectorAll('#themeSeg .seg-btn').forEach(b =>
    b.addEventListener('click', () => setTheme(b.dataset.themeVal)));
  document.querySelectorAll('#langSeg .seg-btn').forEach(b =>
    b.addEventListener('click', () => setLang(b.dataset.langVal)));

  // Volume
  const volSlider = document.getElementById('volSlider');
  const volIcon   = document.getElementById('volIcon');
  try { masterVolume = parseFloat(localStorage.getItem('rtd_vol') ?? '0.6'); } catch(e){}
  if (volSlider) {
    volSlider.value = Math.round(masterVolume * 100);
    volSlider.addEventListener('input', () => {
      masterVolume = volSlider.value / 100;
      try { localStorage.setItem('rtd_vol', masterVolume); } catch(e){}
      if (musicNodes?.master) musicNodes.master.gain.setValueAtTime(0.13 * masterVolume, audioCtx.currentTime);
      volIcon.textContent = masterVolume === 0 ? '🔇' : masterVolume < 0.4 ? '🔉' : '🔊';
    });
    volIcon.textContent = masterVolume === 0 ? '🔇' : masterVolume < 0.4 ? '🔉' : '🔊';
  }

  applyI18n();
})();
