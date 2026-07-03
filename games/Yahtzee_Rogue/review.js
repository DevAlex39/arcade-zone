// ══════════════════════════════════════════════════════════════════
//  REVIEW NAVIGATOR — outil interne pour passer en revue les écrans
//  (n'altère pas la logique du jeu ; sauter directement à n'importe
//   quel écran avec un état réaliste pour faciliter les retours design)
// ══════════════════════════════════════════════════════════════════
(function () {
  function pick(id) {
    const j = JOKER_POOL.find(x => x.id === id);
    return j ? { ...j } : null;
  }
  function cons(id) {
    const c = CONSUMABLE_POOL.find(x => x.id === id);
    return c ? { ...c } : null;
  }
  const MOD = id => MODIFIERS.find(m => m.id === id);

  // Construit un run réaliste : jokers (dont un modifié + un fantôme),
  // consommables, or et stats.
  function setupRun() {
    resetGame('REVIEW42');
    G.ante  = 2;
    G.gold  = 17;
    const jB = pick('briscard');
    const jD = pick('doubleur'); if (jD) { jD.modifier = MOD('golden'); jD.cost += 2; }
    const jS = pick('stratege');
    const jM = pick('marathonien');
    const jP = pick('chanceux'); if (jP) { jP.modifier = MOD('phantom'); jP.phantom = true; }
    G.jokers = [jB, jD, jS, jM, jP].filter(Boolean);
    G.consumables = [cons('oracle'), cons('elixir')].filter(Boolean);
    G.runHands = 12; G.runScore = 8430; G.runYahtzees = 2;
  }

  function goTitle() { showScreen('screenTitle'); }

  function goBlind(boss) {
    setupRun();
    G.blindIdx = boss ? 2 : 0;
    showBlindIntro();
  }

  function goGame(boss) {
    setupRun();
    G.blindIdx = boss ? 2 : 1;
    if (boss) { G.ante = 3; }
    startBlind();
    // Donner vie à l'écran : une main lancée
    G.hasRolled = true;
    G.rollsLeft = Math.max(0, getMaxRolls() - 1);
    G.handsLeft = 3;
    G.score     = 1240;
    const n = getDiceCount();
    const sample = [5, 5, 2, 3, 6, 4].slice(0, n);
    G.dice = sample;
    G.kept = sample.map((_, i) => i < 2);
    renderHeader();
    renderDice();
    renderCombos();
    renderSidePanel();
    updateRollBtn && updateRollBtn();
  }

  function goShop() {
    setupRun();
    G.blindIdx = 0;
    openShop();
  }

  function goGameOver() {
    setupRun();
    G.target = 12000;
    G.score  = 8430;
    loseGame();
  }

  function goWin() {
    setupRun();
    G.ante = 5;
    showWin();
  }

  const SCREENS_DEF = [
    { label: 'Titre',        fn: goTitle },
    { label: 'Annonce',      fn: () => goBlind(false) },
    { label: 'Annonce Boss', fn: () => goBlind(true) },
    { label: 'Jeu',          fn: () => goGame(false) },
    { label: 'Jeu Boss',     fn: () => goGame(true) },
    { label: 'Boutique',     fn: goShop },
    { label: 'Game Over',    fn: goGameOver },
    { label: 'Victoire',     fn: goWin },
  ];

  function build() {
    const bar = document.createElement('div');
    bar.id = 'reviewNav';
    bar.innerHTML = `<span class="rv-title">Revue des écrans</span>`;
    SCREENS_DEF.forEach((s, i) => {
      const b = document.createElement('button');
      b.className = 'rv-btn';
      b.textContent = s.label;
      b.addEventListener('click', () => {
        try { s.fn(); } catch (e) { console.error('[review]', e); }
        bar.querySelectorAll('.rv-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
      });
      bar.appendChild(b);
    });
    const hide = document.createElement('button');
    hide.className = 'rv-btn rv-hide';
    hide.textContent = '×';
    hide.title = 'Masquer la barre (R pour réafficher)';
    hide.addEventListener('click', () => bar.classList.add('rv-hidden'));
    bar.appendChild(hide);
    document.body.appendChild(bar);

    const style = document.createElement('style');
    style.textContent = `
      #reviewNav{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);
        z-index:99999;display:flex;align-items:center;gap:6px;
        padding:8px 10px;border-radius:14px;
        background:rgba(14,18,30,.86);backdrop-filter:blur(14px);
        border:1px solid rgba(255,255,255,.12);
        box-shadow:0 10px 34px rgba(0,0,0,.5);
        font-family:'Space Grotesk',system-ui,sans-serif;
        transition:opacity .2s,transform .2s;}
      #reviewNav.rv-hidden{opacity:0;pointer-events:none;transform:translateX(-50%) translateY(20px);}
      #reviewNav .rv-title{font-size:11px;font-weight:600;letter-spacing:.04em;
        text-transform:uppercase;color:rgba(255,255,255,.45);padding:0 8px 0 4px;
        border-right:1px solid rgba(255,255,255,.1);margin-right:2px;}
      #reviewNav .rv-btn{appearance:none;border:1px solid rgba(255,255,255,.1);
        background:rgba(255,255,255,.05);color:rgba(255,255,255,.82);
        font:inherit;font-size:13px;font-weight:600;padding:7px 12px;border-radius:9px;
        cursor:pointer;transition:all .15s;white-space:nowrap;}
      #reviewNav .rv-btn:hover{background:rgba(255,255,255,.13);color:#fff;
        border-color:rgba(255,255,255,.25);}
      #reviewNav .rv-btn.active{background:linear-gradient(135deg,#46d6ff,#8b7bff);
        color:#0a0e1a;border-color:transparent;}
      #reviewNav .rv-hide{padding:7px 11px;color:rgba(255,255,255,.5);font-size:16px;line-height:1;}
    `;
    document.head.appendChild(style);

    // R (sans tenir) ne doit pas masquer — on réutilise une touche dédiée
    document.addEventListener('keydown', e => {
      if ((e.key === 'n' || e.key === 'N') && !e.repeat) bar.classList.toggle('rv-hidden');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
