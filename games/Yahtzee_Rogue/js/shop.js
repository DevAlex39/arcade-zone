'use strict';

// ══════════════════════════════════════════════════════════════════
//  BOUTIQUE — génération, achat/vente, boîtes boosters
// ══════════════════════════════════════════════════════════════════
function openShop() {
  G.shopRerollCost = 2;
  generateShopItems();
  renderShop();
  showScreen('screenShop');
}

const RARITY_WEIGHTS = { common:5, uncommon:3, rare:1.2, legendary:0.25, phantom_uncommon:0.4, phantom_rare:0.2, phantom_legendary:0.06 };

function rarityWeight(j) {
  if (j.phantom) return RARITY_WEIGHTS[`phantom_${j.rarity}`] ?? 0.1;
  return RARITY_WEIGHTS[j.rarity] ?? 1;
}

function generateShopItems() {
  // Re-seeder à chaque visite boutique pour la reproductibilité
  initSeed(G.seed);

  const ownedIds = G.jokers.map(j => j.id);
  const available = JOKER_POOL.filter(j => !ownedIds.includes(j.id));
  const weighted  = available
    .map(j => ({ j, score: _shopRng() * rarityWeight(j) }))
    .sort((a, b) => b.score - a.score);
  G.shopItems.jokers = weighted.slice(0, 3).map(x => {
    const j   = { ...x.j, sold: false };
    // Tirage du modificateur
    const roll = _shopRng();
    let cumul  = 0;
    for (const mod of MODIFIERS) {
      cumul += mod.prob;
      if (roll < cumul) {
        j.modifier = mod;
        j.cost += (mod.costBonus ?? 0);
        if (mod.isPhantom) j.phantom = true;
        break;
      }
    }
    return j;
  });

  // Consommables OU boîtes (constellation / joker / les deux)
  const r = _shopRng();
  if (r < 0.38) {
    // Consommables uniquement
    const allCons = [...CONSUMABLE_POOL].map(c => ({ ...c, _w: _shopRng() })).sort((a,b)=>b._w-a._w);
    G.shopItems.consumables = allCons.slice(0, 2).map(c => ({ ...c, sold: false }));
    G.shopItems.boosters    = [];
  } else if (r < 0.60) {
    // Boîtes Constellation
    G.shopItems.consumables = [];
    G.shopItems.boosters    = [{ kind:'constellation', type:'small', cost:4, sold:false }];
    if (_shopRng() < 0.4) G.shopItems.boosters.push({ kind:'constellation', type:'large', cost:8, sold:false });
  } else if (r < 0.82) {
    // Boîtes Joker
    G.shopItems.consumables = [];
    G.shopItems.boosters    = [{ kind:'joker', type:'small', cost:4, sold:false }];
    if (_shopRng() < 0.4) G.shopItems.boosters.push({ kind:'joker', type:'large', cost:8, sold:false });
  } else {
    // Les deux types (petites boîtes seulement)
    G.shopItems.consumables = [];
    G.shopItems.boosters    = [
      { kind:'constellation', type:'small', cost:4, sold:false },
      { kind:'joker',         type:'small', cost:4, sold:false },
    ];
  }
}

function renderShop() {
  document.getElementById('shopSub').textContent = t('shopSub', {n: G.ante, next: [t('bigBlind'), t('bossBlind'), t('nextAnte')][G.blindIdx] ?? t('nextAnte'), seed: G.seed});
  document.getElementById('shopGold').textContent = G.gold;
  const costEl = document.querySelector('#btnRerollShop .reroll-cost');
  if (costEl) costEl.textContent = `(${G.shopRerollCost}💰)`;

  renderShopSection('shopJokers',      G.shopItems.jokers,      'joker');
  renderShopSection('shopConsumables', G.shopItems.consumables,  'consumable');
  const consuLbl = document.getElementById('shopConsuLabel');
  if (consuLbl) consuLbl.classList.toggle('hidden', !G.shopItems.consumables.length);
  renderBoosterSection();
  renderOwnedSection('ownedJokers',      G.jokers,      'joker');
  renderOwnedSection('ownedConsumables', G.consumables, 'consumable');
}

function renderOwnedSection(elId, items, type) {
  const el = document.getElementById(elId);
  el.innerHTML = '';
  if (!items.length) {
    el.innerHTML = `<span style="color:var(--grey);font-size:.85rem">${t('none2')}</span>`;
    return;
  }
  items.forEach((item, idx) => {
    const sellPrice = Math.max(1, Math.floor((item.cost ?? 2) / 2));
    const div = document.createElement('div');
    div.className = 'shop-item sell-item';
    if (type === 'joker') div.dataset.rarity = item.rarity || 'common';
    if (type === 'joker' && item.modifier) div.dataset.modifier = item.modifier.id;
    const modBadge = item.modifier
      ? `<span class="mod-badge" style="color:${item.modifier.color}">${item.modifier.icon}</span>` : '';
    div.innerHTML = `
      <div class="si-icon">${jicon(item)}</div>
      <div class="si-name">${jn(item)} ${modBadge}</div>
      <div class="si-desc">${jdc(item)}</div>
      <div class="si-footer">
        <span class="si-cost sell-price">💰 ${sellPrice}</span>
        <button class="si-btn si-sell-btn">${t('sell')}</button>
      </div>`;
    if (type === 'joker' && item.modifier) div.insertAdjacentHTML('beforeend', modTipHTML(item.modifier));
    div.querySelector('.si-sell-btn').addEventListener('click', () => {
      if (type === 'joker')      G.jokers.splice(idx, 1);
      if (type === 'consumable') G.consumables.splice(idx, 1);
      G.gold += sellPrice;
      toast(t('sold', {name: jn(item), p: sellPrice}), 'gold');
      renderShop();
    });
    el.appendChild(div);
  });
}

function renderShopSection(elId, items, type) {
  const el = document.getElementById(elId);
  el.innerHTML = '';
  if (!items.length) {
    el.innerHTML = `<span style="color:var(--grey);font-size:.85rem">${t('nothingAvail')}</span>`;
    return;
  }
  items.forEach(item => {
    const canBuy  = !item.sold && G.gold >= item.cost;
    const tooMany = type === 'joker' && G.jokers.length >= getMaxJokers();
    const div = document.createElement('div');
    div.className = 'shop-item' + (item.sold ? ' sold' : '');
    if (type === 'joker') div.dataset.rarity = item.rarity || 'common';
    if (type === 'joker' && item.modifier) div.dataset.modifier = item.modifier.id;
    const modBadge = item.modifier
      ? `<span class="mod-badge" style="color:${item.modifier.color}">${item.modifier.icon}</span>` : '';
    div.innerHTML = `
      <div class="si-icon">${jicon(item)}</div>
      <div class="si-name">${jn(item)} ${modBadge}</div>
      <div class="si-type">${type==='joker' ? rarityLabel(item.rarity) : `<span style="color:var(--green)">${t('consumable')}</span>`}</div>
      <div class="si-desc">${jdc(item)}</div>
      <div class="si-footer">
        <span class="si-cost">💰 ${item.cost}</span>
        <button class="si-btn" ${(!canBuy||item.sold||tooMany)?'disabled':''}>
          ${item.sold ? t('sold2') : tooMany ? t('full') : t('buy')}
        </button>
      </div>`;
    if (item.modifier) div.insertAdjacentHTML('beforeend', modTipHTML(item.modifier));
    div.querySelector('.si-btn')?.addEventListener('click', () => buyItem(item, type));
    el.appendChild(div);
  });
}

function buyItem(item, type) {
  if (G.gold < item.cost || item.sold) return;
  if (type === 'joker' && !item.phantom && G.jokers.filter(j=>!j.phantom).length >= getMaxJokers()) {
    toast(t('slotsJokersFull'),'red'); return;
  }
  if (type === 'consumable' && G.consumables.length >= MAX_CONSUMABLES) {
    toast(t('slotsConsumFull'),'red'); return;
  }
  G.gold -= item.cost;
  item.sold = true;
  if (type === 'joker')      G.jokers.push(item);
  if (type === 'consumable') G.consumables.push(item);
  toast(t('bought', {g: item.phantom ? '👻 ' : '', name: jn(item)}), 'green');
  renderShop();
}

document.getElementById('btnRerollShop').addEventListener('click', () => {
  const cost = G.shopRerollCost;
  if (G.gold < cost) { toast(t('notEnoughGold'),'red'); return; }
  G.gold -= cost;
  G.shopRerollCost *= 2;
  generateShopItems();
  renderShop();
  toast(t('shopRerolled', {c: G.shopRerollCost}), 'gold');
});

document.getElementById('btnNextBlind').addEventListener('click', () => {
  G.blindIdx++;
  if (G.blindIdx > 2) {
    G.blindIdx = 0;
    G.ante++;
    if (G.ante > 5) { showWin(); return; }
  }
  showBlindIntro();
});

// ══════════════════════════════════════════════════════════════════
//  BOOSTERS — boîtes constellation & joker
// ══════════════════════════════════════════════════════════════════
function renderBoosterSection() {
  const sec = document.getElementById('shopBoosters');
  const lbl = document.getElementById('shopBoosterLabel');
  sec.innerHTML = '';
  if (!G.shopItems.boosters?.length) {
    lbl.classList.add('hidden');
    sec.classList.add('hidden');
    return;
  }
  lbl.classList.remove('hidden');
  sec.classList.remove('hidden');
  G.shopItems.boosters.forEach(b => {
    const isCons  = b.kind !== 'joker';
    const isSmall = b.type === 'small';
    const boxImg  = isCons
      ? (isSmall ? IMG('boites-boutique','boite-peu-commune.png') : IMG('boites-boutique','boite-rare.png'))
      : (isSmall ? IMG('boites-boutique','boite-commune.png')     : IMG('boites-boutique','boite-legendaire.png'));
    const icon    = `<img src="${boxImg}" class="card-art" alt="" style="max-height:56px">`;
    const picks   = isCons ? (isSmall ? 4 : 8) : (isSmall ? 3 : 5);
    const name    = isCons ? t(isSmall ? 'smallBoxConstellation' : 'largeBoxConstellation')
                           : t(isSmall ? 'smallBoxJoker' : 'largeBoxJoker');
    const desc    = isCons ? t('boxDescConstellation', {n: picks}) : t('boxDescJoker', {n: picks});
    const typeCol = isCons ? 'var(--chips-col)' : 'var(--gold)';
    const div = document.createElement('div');
    div.className = 'shop-item booster-shop-item' + (b.sold ? ' sold' : '');
    div.innerHTML = `
      <div class="si-icon">${icon}</div>
      <div class="si-name">${name}</div>
      <div class="si-type" style="color:${typeCol}">${isCons ? t('boxMetaConstellation', {n: picks}) : t('boxMetaJoker', {n: picks})}</div>
      <div class="si-desc">${desc}</div>
      <div class="si-footer">
        <span class="si-cost">💰 ${b.cost}</span>
        <button class="si-btn" ${b.sold || G.gold < b.cost ? 'disabled' : ''}>${b.sold ? t('opened') : t('open')}</button>
      </div>`;
    div.querySelector('.si-btn')?.addEventListener('click', () => buyBooster(b));
    sec.appendChild(div);
  });
}

function buyBooster(booster) {
  if (G.gold < booster.cost || booster.sold) return;
  G.gold -= booster.cost;
  booster.sold = true;
  renderShop();
  if (booster.kind === 'joker') {
    const boxImg = booster.type === 'small' ? IMG('boites-boutique','boite-commune.png') : IMG('boites-boutique','boite-legendaire.png');
    openJokerBoosterModal(booster.type === 'small' ? 3 : 5, boxImg);
  } else {
    const boxImg = booster.type === 'small' ? IMG('boites-boutique','boite-peu-commune.png') : IMG('boites-boutique','boite-rare.png');
    openBoosterModal(booster.type === 'small' ? 4 : 8, boxImg);
  }
}

function openBoosterModal(count, boxImg = IMG('boites-boutique','boite-peu-commune.png')) {
  // Sélectionner 'count' constellations aléatoires (avec remplacement possible pour stacks)
  const pool    = [...CONSTELLATIONS];
  shuffleArray(pool);
  const picks   = pool.slice(0, Math.min(count, pool.length));

  // Créer le modal
  let overlay = document.getElementById('boosterOverlay');
  if (overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.id        = 'boosterOverlay';
  overlay.className = 'booster-overlay';
  overlay.innerHTML = `
    <div class="booster-modal" id="boosterModal">
      <h3 class="booster-title">${t('constellationBox')}</h3>
      <div class="booster-box-wrap" id="boosterBoxWrap">
        <div class="booster-box-img" id="boosterBox">
          <img src="${boxImg}" alt="" class="booster-box-art">
          <div class="booster-box-glow"></div>
        </div>
        <p class="booster-click-hint">${t('clickToOpen')}</p>
      </div>
      <div class="booster-cards hidden" id="boosterCards"></div>
      <p class="booster-pick-hint hidden" id="boosterPickHint">${t('pickConstellation')}</p>
    </div>`;
  document.body.appendChild(overlay);

  // Construire les cartes (cachées au départ)
  const cardsEl = overlay.querySelector('#boosterCards');
  picks.forEach(con => {
    const existing = G.comboBoosts[con.combo];
    const card = document.createElement('div');
    card.className = 'booster-card';
    card.innerHTML = `
      <div class="bc-icon">${jicon(con)}</div>
      <div class="bc-name">${jn(con)}</div>
      <div class="bc-combo">${cn(con.combo)}</div>
      <div class="bc-bonus">${jdc(con)}</div>
      ${existing ? `<div class="bc-level">${t('currentLevel', {c: existing.chips, m: existing.mult})}</div>` : ''}`;
    card.addEventListener('click', () => applyConstellation(con, overlay));
    cardsEl.appendChild(card);
  });

  // Clic sur la boîte → animation d'ouverture
  overlay.querySelector('#boosterBox').addEventListener('click', function() {
    this.classList.add('open');
    spawnStars(overlay.querySelector('#boosterBoxWrap'));
    setTimeout(() => {
      overlay.querySelector('#boosterBoxWrap').classList.add('hidden');
      cardsEl.classList.remove('hidden');
      overlay.querySelector('#boosterPickHint').classList.remove('hidden');
      cardsEl.querySelectorAll('.booster-card').forEach((c, i) => {
        c.style.transitionDelay = `${i * 80}ms`;
        c.classList.add('revealed');
      });
    }, 720);
  }, { once: true });
}

function applyConstellation(con, overlay) {
  if (!G.comboBoosts[con.combo]) G.comboBoosts[con.combo] = { chips:0, mult:0 };
  G.comboBoosts[con.combo].chips += con.bonus.chips;
  G.comboBoosts[con.combo].mult  += con.bonus.mult;
  toast(t('constellationApplied', {name: jn(con), combo: cn(con.combo), c: con.bonus.chips, m: con.bonus.mult}), 'green');
  overlay.classList.add('hidden');
  setTimeout(() => overlay.remove(), 400);
}

function openJokerBoosterModal(count, boxImg = IMG('boites-boutique','boite-commune.png')) {
  const ownedIds  = G.jokers.map(j => j.id);
  const available = JOKER_POOL.filter(j => !ownedIds.includes(j.id));
  const pool      = [...available];
  const picks     = [];
  const needed    = Math.min(count, pool.length);

  for (let i = 0; i < needed; i++) {
    const totalW = pool.reduce((s, j) => s + rarityWeight(j), 0);
    let r = Math.random() * totalW;
    let chosen = pool[pool.length - 1];
    for (const j of pool) { r -= rarityWeight(j); if (r <= 0) { chosen = j; break; } }
    const jj = { ...chosen, sold: false };
    const roll = Math.random();
    let cumul = 0;
    for (const mod of MODIFIERS) {
      cumul += mod.prob;
      if (roll < cumul) {
        jj.modifier = mod;
        jj.cost = (jj.cost ?? 5) + (mod.costBonus ?? 0);
        if (mod.isPhantom) jj.phantom = true;
        break;
      }
    }
    picks.push(jj);
    pool.splice(pool.findIndex(p => p.id === chosen.id), 1);
  }

  let overlay = document.getElementById('jokerBoosterOverlay');
  if (overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.id        = 'jokerBoosterOverlay';
  overlay.className = 'booster-overlay';
  overlay.innerHTML = `
    <div class="booster-modal">
      <h3 class="booster-title">${t('jokerBox')}</h3>
      <div class="booster-box-wrap" id="jokerBoosterBoxWrap">
        <div class="booster-box-img" id="jokerBoosterBox">
          <img src="${boxImg}" alt="" class="booster-box-art">
          <div class="booster-box-glow"></div>
        </div>
        <p class="booster-click-hint">${t('clickToOpen')}</p>
      </div>
      <div class="booster-cards hidden" id="jokerBoosterCards"></div>
      <p class="booster-pick-hint hidden" id="jokerBoosterPickHint">${t('pickJoker')}</p>
    </div>`;
  document.body.appendChild(overlay);

  const cardsEl = overlay.querySelector('#jokerBoosterCards');
  picks.forEach(j => {
    const canAdd   = j.phantom || G.jokers.filter(x => !x.phantom).length < getMaxJokers();
    const modBadge = j.modifier
      ? `<span class="mod-badge" style="color:${j.modifier.color}">${j.modifier.icon}</span>` : '';
    const card = document.createElement('div');
    card.className    = 'booster-card joker-booster-card';
    card.dataset.rarity = j.rarity || 'common';
    if (j.modifier) card.dataset.modifier = j.modifier.id;
    card.innerHTML = `
      <div class="bc-icon">${jicon(j)}</div>
      <div class="bc-name">${jn(j)} ${modBadge}</div>
      <div class="bc-combo">${rarityLabel(j.rarity)}</div>
      <div class="bc-bonus">${jdc(j)}</div>
      ${!canAdd ? `<div class="bc-level" style="color:#f87171">${t('slotsFullShort')}</div>` : ''}`;
    if (j.modifier) card.insertAdjacentHTML('beforeend', modTipHTML(j.modifier));
    card.addEventListener('click', () => {
      if (!canAdd) { toast(t('slotsJokersFull'), 'red'); return; }
      G.jokers.push(j);
      toast(t('jokerAdded', {g: j.phantom ? '👻 ' : '', name: jn(j)}), 'green');
      overlay.classList.add('hidden');
      setTimeout(() => overlay.remove(), 400);
    });
    cardsEl.appendChild(card);
  });

  overlay.querySelector('#jokerBoosterBox').addEventListener('click', function() {
    this.classList.add('open');
    spawnStars(overlay.querySelector('#jokerBoosterBoxWrap'));
    setTimeout(() => {
      overlay.querySelector('#jokerBoosterBoxWrap').classList.add('hidden');
      cardsEl.classList.remove('hidden');
      overlay.querySelector('#jokerBoosterPickHint').classList.remove('hidden');
      cardsEl.querySelectorAll('.joker-booster-card').forEach((c, i) => {
        c.style.transitionDelay = `${i * 80}ms`;
        c.classList.add('revealed');
      });
    }, 720);
  }, { once: true });
}
