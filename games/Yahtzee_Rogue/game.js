'use strict';

// ══════════════════════════════════════════════════════════════════
//  I18N — français / anglais
// ══════════════════════════════════════════════════════════════════
let LANG = (() => { try { return localStorage.getItem('rtd_lang') || 'fr'; } catch (e) { return 'fr'; } })();

const I18N = {
  fr: {
    tagline: 'Un roguelike de dés',
    seedPlaceholder: 'Seed (optionnel)',
    seedHint: '# laissez vide pour un seed aléatoire',
    startGame: 'Commencer la partie',
    titleHint: 'Battez les blinds · achetez des jokers · survivez au boss',
    targetScore: 'Score cible', bossEffect: 'Effet Boss', handsAvailable: 'Mains disponibles', play: 'Jouer',
    ante: 'Ante', score: 'Score', target: 'Cible', hands: 'Mains', rolls: 'Lancers',
    jokers: 'Jokers', buyJokers: 'Achetez des jokers<br/>en boutique', consumables: 'Consommables',
    encyclopedia: 'Encyclopédie', fogOverlay: 'La Brume — dés cachés jusqu\'à la soumission',
    chooseCombo: 'Choisissez une combinaison à jouer', gold: 'Or', run: 'Run', shop: 'Boutique',
    boxes: 'Boîtes', sellItems: 'Vendre mes articles', rerollShop: 'Relancer boutique', nextBlind: 'Prochaine blind →',
    gameOver: 'Game Over', restart: 'Recommencer', victory: 'Victoire !', victorySub: 'Vous avez battu tous les antes !',
    replay: 'Rejouer', restarting: 'Recommencer…',
    smallBlind: 'Petite Blind', bigBlind: 'Grande Blind', bossBlind: 'Boss Blind',
    blindNameSmall: 'Ante {n} — Petite', blindNameBig: 'Ante {n} — Grande',
    ban1Effect: 'Les dés montrant {v} sont bannis — ils valent 0 et ne comptent pas dans les combinaisons.',
    rollDiceBtn: 'Lancer les dés', noRolls: 'Plus de lancers', lastRoll: 'Dernier lancer !', rerollBtn: 'Relancer ({n})',
    hintStart: 'Cliquez sur Lancer pour commencer', hintNoRolls: '⚠️ Plus de lancers — jouez une combinaison !',
    hintLast: 'Dernier lancer disponible.', hintKeep: 'Conservez des dés ou relancez.',
    keptLabel: '🔒 GARDÉ',
    calcScore: '— Calcul du score —', finalScore: '✨ Score final', chips: 'Chips', mult: 'Mult', pts: 'pts',
    noCombo: 'Aucune combinaison', comboPlayed: '{name} → {score} pts',
    blindBeaten: '🎉 Blind battue ! +4 or',
    gameOverSub: 'Vous avez échoué à atteindre {target} pts (score : {score})',
    statsAnte: 'Ante atteint', statsHands: 'Mains jouées', statsRunScore: 'Score total du run',
    statsYahtzees: 'Yahtzees', statsAntesDone: 'Antes complétés', statsJokersLabel: 'Jokers', none: 'aucun',
    shopSub: 'Ante {n} — {next} vous attend. · Seed : #{seed}',
    nextAnte: 'Ante suivante', consumable: 'Consommable',
    slotsJokersFull: 'Slots jokers pleins !', slotsConsumFull: 'Slots consommables pleins (max 2) !',
    bought: '✅ {g}{name} acheté !', sold: '💸 {name} vendu pour {p}💰',
    notEnoughGold: 'Pas assez d\'or !', shopRerolled: '🔄 Boutique relancée (prochain reroll : {c}💰)',
    jokersCount: '🃏 Jokers {n}/{max}',
    runStats: 'Seed : <b>#{seed}</b><br/>Mains : {h} · Yahtzees : {y}<br/>Score run : {s}',
    sell: 'Vendre', buy: 'Acheter', sold2: 'Vendu', full: 'Plein', none2: 'Aucun', nothingAvail: 'Rien disponible',
    wildHint: '🎭 Cliquez sur un dé pour changer sa valeur', freeRoll: '🎁 +1 lancer gratuit !',
    doubleCombo: '💥 Prochaine combo doublée !', frozen: '🧊 Dé {v} gelé !', mirrored: '🔁 Dés inversés !',
    oracleActive: '🔮 Oracle actif — +2 Mult sur cette main !', plus3gold: '🤑 +3 💰 !',
    targetReduced: '⏩ Cible réduite à {t} pts !', wildChanged: '🎭 Dé changé en {v} !', chooseValue: 'Choisir :',
    parasiteNeutralized: '🦠 {name} neutralisé ce lancer !',
    tRentier: '+1 💰 (Rentier)', tBanquier: '+2 💰 (Banquier)', tProspecteur: '+{g} 💰 (Prospecteur)', tMarchand: '+{g} 💰 (Marchand)',
    constellationBox: '🌌 Boîte Constellation', jokerBox: '🃏 Boîte Joker', clickToOpen: 'Cliquez sur la boîte pour l\'ouvrir',
    pickConstellation: '✨ Choisissez une constellation pour améliorer cette combo définitivement',
    pickJoker: '🃏 Choisissez un joker — il rejoint votre collection !',
    constellationApplied: '🌌 {name} appliquée ! {combo} +{c}C +{m}M', jokerAdded: '✅ {g}{name} ajouté !',
    slotsFullShort: 'Slots pleins !', currentLevel: 'Niv. actuel : +{c}C +{m}M',
    smallBoxConstellation: 'Petite Boîte Constellation', largeBoxConstellation: 'Grande Boîte Constellation',
    smallBoxJoker: 'Petite Boîte Joker', largeBoxJoker: 'Grande Boîte Joker',
    boxMetaConstellation: '{n} choix · Constellation', boxMetaJoker: '{n} choix · Joker',
    boxDescConstellation: 'Choisissez 1 constellation parmi {n} pour améliorer une combo',
    boxDescJoker: 'Choisissez 1 joker parmi {n} tirés au sort', open: 'Acheter', opened: 'Ouverte',
    rCommon: 'Commun', rUncommon: 'Peu commun', rRare: 'Rare', rLegendary: 'Légendaire',
    mPhantom: 'Fantôme', mGolden: 'Doré', mAmplified: 'Amplifié', mLucky: 'Étoilé',
    mdPhantom: 'Ne prend pas de slot joker', mdGolden: '+50 Chips sur chaque combo',
    mdAmplified: 'Mult ×1.25 sur chaque combo', mdLucky: '+20 Chips +1 Mult sur chaque combo',
    phantoms: '👻 Fantômes',
    encycloTitle: '📖 Encyclopédie', tabJokers: 'Jokers ({n})', tabConsumables: 'Consommables ({n})',
    gCommons: 'Communs', gUncommons: 'Peu communs', gRares: 'Rares', gLegendaries: 'Légendaires',
    owned: '✓ Possédé', clickToUse: 'Cliquer pour utiliser',
    moveLeft: 'Déplacer à gauche', moveRight: 'Déplacer à droite',
  },
  en: {
    tagline: 'A dice roguelike',
    seedPlaceholder: 'Seed (optional)',
    seedHint: '# leave blank for a random seed',
    startGame: 'Start game',
    titleHint: 'Beat the blinds · buy jokers · survive the boss',
    targetScore: 'Target score', bossEffect: 'Boss Effect', handsAvailable: 'Hands available', play: 'Play',
    ante: 'Ante', score: 'Score', target: 'Target', hands: 'Hands', rolls: 'Rolls',
    jokers: 'Jokers', buyJokers: 'Buy jokers<br/>in the shop', consumables: 'Consumables',
    encyclopedia: 'Encyclopedia', fogOverlay: 'The Mist — dice hidden until you submit',
    chooseCombo: 'Choose a combination to play', gold: 'Gold', run: 'Run', shop: 'Shop',
    boxes: 'Boxes', sellItems: 'Sell my items', rerollShop: 'Reroll shop', nextBlind: 'Next blind →',
    gameOver: 'Game Over', restart: 'Restart', victory: 'Victory!', victorySub: 'You beat every ante!',
    replay: 'Play again', restarting: 'Restarting…',
    smallBlind: 'Small Blind', bigBlind: 'Big Blind', bossBlind: 'Boss Blind',
    blindNameSmall: 'Ante {n} — Small', blindNameBig: 'Ante {n} — Big',
    ban1Effect: 'Dice showing {v} are banned — they\'re worth 0 and don\'t count in combinations.',
    rollDiceBtn: 'Roll the dice', noRolls: 'No rolls left', lastRoll: 'Last roll!', rerollBtn: 'Reroll ({n})',
    hintStart: 'Click Roll to begin', hintNoRolls: '⚠️ No rolls left — play a combination!',
    hintLast: 'Last roll available.', hintKeep: 'Keep dice or reroll.',
    keptLabel: '🔒 KEPT',
    calcScore: '— Scoring —', finalScore: '✨ Final score', chips: 'Chips', mult: 'Mult', pts: 'pts',
    noCombo: 'No combination', comboPlayed: '{name} → {score} pts',
    blindBeaten: '🎉 Blind beaten! +4 gold',
    gameOverSub: 'You failed to reach {target} pts (score: {score})',
    statsAnte: 'Ante reached', statsHands: 'Hands played', statsRunScore: 'Total run score',
    statsYahtzees: 'Yahtzees', statsAntesDone: 'Antes completed', statsJokersLabel: 'Jokers', none: 'none',
    shopSub: 'Ante {n} — {next} awaits. · Seed: #{seed}',
    nextAnte: 'Next Ante', consumable: 'Consumable',
    slotsJokersFull: 'Joker slots full!', slotsConsumFull: 'Consumable slots full (max 2)!',
    bought: '✅ {g}{name} purchased!', sold: '💸 {name} sold for {p}💰',
    notEnoughGold: 'Not enough gold!', shopRerolled: '🔄 Shop rerolled (next reroll: {c}💰)',
    jokersCount: '🃏 Jokers {n}/{max}',
    runStats: 'Seed: <b>#{seed}</b><br/>Hands: {h} · Yahtzees: {y}<br/>Run score: {s}',
    sell: 'Sell', buy: 'Buy', sold2: 'Sold', full: 'Full', none2: 'None', nothingAvail: 'Nothing available',
    wildHint: '🎭 Click a die to change its value', freeRoll: '🎁 +1 free roll!',
    doubleCombo: '💥 Next combo doubled!', frozen: '🧊 Die {v} frozen!', mirrored: '🔁 Dice flipped!',
    oracleActive: '🔮 Oracle active — +2 Mult this hand!', plus3gold: '🤑 +3 💰 !',
    targetReduced: '⏩ Target reduced to {t} pts!', wildChanged: '🎭 Die changed to {v}!', chooseValue: 'Choose:',
    parasiteNeutralized: '🦠 {name} disabled this roll!',
    tRentier: '+1 💰 (Landlord)', tBanquier: '+2 💰 (Banker)', tProspecteur: '+{g} 💰 (Prospector)', tMarchand: '+{g} 💰 (Merchant)',
    constellationBox: '🌌 Constellation Box', jokerBox: '🃏 Joker Box', clickToOpen: 'Click the box to open it',
    pickConstellation: '✨ Choose a constellation to permanently upgrade that combo',
    pickJoker: '🃏 Choose a joker — it joins your collection!',
    constellationApplied: '🌌 {name} applied! {combo} +{c}C +{m}M', jokerAdded: '✅ {g}{name} added!',
    slotsFullShort: 'Slots full!', currentLevel: 'Current lvl: +{c}C +{m}M',
    smallBoxConstellation: 'Small Constellation Box', largeBoxConstellation: 'Large Constellation Box',
    smallBoxJoker: 'Small Joker Box', largeBoxJoker: 'Large Joker Box',
    boxMetaConstellation: '{n} choices · Constellation', boxMetaJoker: '{n} choices · Joker',
    boxDescConstellation: 'Choose 1 constellation out of {n} to upgrade a combo',
    boxDescJoker: 'Choose 1 joker out of {n} drawn at random', open: 'Buy', opened: 'Opened',
    rCommon: 'Common', rUncommon: 'Uncommon', rRare: 'Rare', rLegendary: 'Legendary',
    mPhantom: 'Phantom', mGolden: 'Golden', mAmplified: 'Amplified', mLucky: 'Starry',
    mdPhantom: 'Takes no joker slot', mdGolden: '+50 Chips on every combo',
    mdAmplified: 'Mult ×1.25 on every combo', mdLucky: '+20 Chips +1 Mult on every combo',
    phantoms: '👻 Phantoms',
    encycloTitle: '📖 Encyclopedia', tabJokers: 'Jokers ({n})', tabConsumables: 'Consumables ({n})',
    gCommons: 'Common', gUncommons: 'Uncommon', gRares: 'Rare', gLegendaries: 'Legendary',
    owned: '✓ Owned', clickToUse: 'Click to use',
    moveLeft: 'Move left', moveRight: 'Move right',
  },
};

function t(key, p) {
  let s = (I18N[LANG] && I18N[LANG][key] != null) ? I18N[LANG][key] : (I18N.fr[key] != null ? I18N.fr[key] : key);
  if (p) for (const k in p) s = s.split('{' + k + '}').join(p[k]);
  return s;
}
function jn(o) { return o ? (LANG === 'en' && o.name_en != null ? o.name_en : o.name) : ''; }
function jd(o) { return o ? (LANG === 'en' && o.desc_en != null ? o.desc_en : o.desc) : ''; }
function cn(id) { const c = COMBOS.find(x => x.id === id); return c ? jn(c) : ''; }
function nf(n) { return Number(n).toLocaleString(LANG === 'en' ? 'en-US' : 'fr'); }
function jicon(o) {
  if (o && o.img) return `<img src="${o.img}" class="card-art" alt="" loading="lazy">`;
  return o && o.fa ? '<i class="' + o.fa + '"></i>' : (o && o.icon ? o.icon : '');
}
function modIconBadge(m) { return m ? '<span class="mod-badge" style="color:' + m.color + '">' + m.icon + '</span>' : ''; }
function modTipHTML(m) { return m ? '<div class="mod-tip" style="--mc:' + m.color + '"><b>' + m.icon + ' ' + modLabel(m) + '</b><span>' + modifierDesc(m.id) + '</span></div>' : ''; }
function applyI18n(root) {
  root = root || document;
  root.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = t(el.getAttribute('data-i18n')); });
  root.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
}

// ══════════════════════════════════════════════════════════════════
//  CONSTANTES
// ══════════════════════════════════════════════════════════════════

const DOT_POSITIONS = {
  1: [[50,50]],
  2: [[28,28],[72,72]],
  3: [[28,28],[50,50],[72,72]],
  4: [[28,28],[72,28],[28,72],[72,72]],
  5: [[28,28],[72,28],[50,50],[28,72],[72,72]],
  6: [[28,22],[28,50],[28,78],[72,22],[72,50],[72,78]],
};

const COMBOS = [
  { id:'ones',      name:'As',          name_en:'Aces',            chips: 10, mult:1 },
  { id:'twos',      name:'Deux',        name_en:'Twos',          chips: 10, mult:1 },
  { id:'threes',    name:'Trois',       name_en:'Threes',         chips: 10, mult:1 },
  { id:'fours',     name:'Quatre',      name_en:'Fours',        chips: 10, mult:1 },
  { id:'fives',     name:'Cinq',        name_en:'Fives',          chips: 10, mult:1 },
  { id:'sixes',     name:'Six',         name_en:'Sixes',           chips: 10, mult:1 },
  { id:'threeKind', name:'Brelan',      name_en:'Three of a Kind',        chips: 30, mult:2 },
  { id:'fourKind',  name:'Carré',       name_en:'Four of a Kind',         chips: 50, mult:3 },
  { id:'fullHouse', name:'Full House',  name_en:'Full House',    chips: 40, mult:3 },
  { id:'smStr',     name:'Petite suite', name_en:'Small Straight',  chips: 60, mult:3 },
  { id:'lgStr',     name:'Grande suite', name_en:'Large Straight',  chips:100, mult:4 },
  { id:'yahtzee',   name:'Yahtzee !',   name_en:'Yahtzee!',     chips:150, mult:5 },
];

// rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
const IMG = (cat, file) => `assets/cards/${cat}/${file}`;

const JOKER_POOL = [
  // ── COMMUNS ─────────────────────────────────────────────────────
  { id:'briscard',   rarity:'common', name:'Le Briscard',  name_en:'The Veteran',    img:IMG('jokers-communs','le-briscard.png'),  cost:3,
    desc:'Brelan → +3 Mult', desc_en:'Three of a Kind → +3 Mult',
    apply:(id,chips,mult)=> id==='threeKind' ? [chips, mult+3] : [chips,mult] },
  { id:'cariste',    rarity:'common', name:'Le Cariste',   name_en:'The Forklift',   img:IMG('jokers-communs','le-cariste.png'),   cost:3,
    desc:'Carré → +50 Chips', desc_en:'Four of a Kind → +50 Chips',
    apply:(id,chips,mult)=> id==='fourKind' ? [chips+50, mult] : [chips,mult] },
  { id:'pleiniste',  rarity:'common', name:'Le Pleiniste', name_en:'The Full Feast', img:IMG('jokers-communs','le-pleiniste.png'), cost:3,
    desc:'Full House → +4 Mult', desc_en:'Full House → +4 Mult',
    apply:(id,chips,mult)=> id==='fullHouse' ? [chips, mult+4] : [chips,mult] },
  { id:'coureur',    rarity:'common', name:'Le Coureur',   name_en:'The Runner',     img:IMG('jokers-communs','le-coureur.png'),   cost:3,
    desc:'Grande suite → +80 Chips', desc_en:'Large Straight → +80 Chips',
    apply:(id,chips,mult)=> id==='lgStr' ? [chips+80, mult] : [chips,mult] },
  { id:'chanceux',   rarity:'common', name:'Le Chanceux',  name_en:'The Lucky One',  img:IMG('jokers-communs','le-chanceux.png'),  cost:3,
    desc:'Petite Suite → +3 Mult', desc_en:'Small Straight → +3 Mult',
    apply:(id,chips,mult)=> id==='smStr' ? [chips, mult+3] : [chips,mult] },
  { id:'avare',      rarity:'common', name:"L'Avare",      name_en:'The Miser',      img:IMG('jokers-communs','lavare.png'),       cost:3,
    desc:'+3 Chips par dé conservé', desc_en:'+3 Chips per kept die',
    apply:(id,chips,mult,dice,kept)=> [chips + kept*3, mult] },
  { id:'fortune',    rarity:'common', name:'La Fortune',   name_en:'Fortune',        img:IMG('jokers-communs','la-fortune.png'),   cost:3,
    desc:'+5 Chips sur chaque combinaison jouée', desc_en:'+5 Chips on every combo played',
    apply:(id,chips,mult)=> [chips+5, mult] },
  { id:'rentier',    rarity:'common', name:'Le Rentier',   name_en:'The Landlord',   img:IMG('jokers-communs','le-rentier.png'),   cost:3,
    desc:'+1 or à chaque blind battue', desc_en:'+1 gold per blind beaten',
    onWinBlind:(j)=>{ G.gold+=1; toast(t('tRentier'),'gold'); },
    apply:(id,chips,mult)=> [chips,mult] },

  // ── PEU COMMUNS ─────────────────────────────────────────────────
  { id:'relanceur',    rarity:'uncommon', name:'Le Relanceur',   name_en:'The Re-Roller',  img:IMG('jokers-peu-communs','le-relanceur.png'),   cost:4,
    desc:'+1 lancer par main', desc_en:'+1 roll per hand',
    apply:(id,chips,mult)=> [chips,mult] },
  { id:'orfevre',      rarity:'uncommon', name:"L'Orfèvre",      name_en:'The Goldsmith',  img:IMG('jokers-peu-communs','lorfevre.png'),        cost:4,
    desc:'Chaque 6 dans la combo +8 Chips', desc_en:'Each 6 in the combo +8 Chips',
    apply:(id,chips,mult,dice)=> [chips + dice.filter(d=>d===6).length*8, mult] },
  { id:'doubleur',     rarity:'uncommon', name:'Le Doubleur',    name_en:'The Doubler',    img:IMG('jokers-peu-communs','le-doubleur.png'),     cost:5,
    desc:'Petite suite → Mult ×2 · Grande suite → Mult ×3', desc_en:'Small Straight → Mult ×2 · Large Straight → Mult ×3',
    apply:(id,chips,mult)=> id==='smStr' ? [chips, mult*2] : id==='lgStr' ? [chips, mult*3] : [chips,mult] },
  { id:'alchimiste',   rarity:'uncommon', name:"L'Alchimiste",   name_en:'The Alchemist',  img:IMG('jokers-peu-communs','lalchimiste.png'),     cost:5,
    desc:'Convertit 10 Chips en +1 Mult (si Chips ≥ 10)', desc_en:'Converts 10 Chips into +1 Mult (if Chips ≥ 10)',
    apply:(id,chips,mult)=> chips >= 10 ? [chips-10, mult+1] : [chips,mult] },
  { id:'serie',        rarity:'uncommon', name:'La Série',       name_en:'The Series',     img:IMG('jokers-peu-communs','la-serie.png'),        cost:4,
    desc:'Catégorie (As/Deux…Six) → +2 Mult', desc_en:'Number category → +2 Mult',
    apply:(id,chips,mult)=> ['ones','twos','threes','fours','fives','sixes'].includes(id) ? [chips, mult+2] : [chips,mult] },
  { id:'raccourci',    rarity:'uncommon', name:'Le Raccourci',   name_en:'The Shortcut',   img:IMG('jokers-peu-communs','le-raccourci.png'),    cost:5,
    desc:'Petite suite valide avec 3 dés consécutifs', desc_en:'Small Straight valid with 3 consecutive dice',
    apply:(id,chips,mult)=> [chips,mult] },
  { id:'banquier',     rarity:'uncommon', name:'Le Banquier',    name_en:'The Banker',     img:IMG('jokers-peu-communs','le-banquier.png'),     cost:5,
    desc:'+2 or à chaque blind battue', desc_en:'+2 gold per blind beaten',
    onWinBlind:(j)=>{ G.gold+=2; toast(t('tBanquier'),'gold'); },
    apply:(id,chips,mult)=> [chips,mult] },
  { id:'prospecteur',  rarity:'uncommon', name:'Le Prospecteur', name_en:'The Prospector', img:IMG('jokers-peu-communs','le-prospecteur.png'), cost:4,
    desc:'Chaque 6 dans la combo jouée rapporte 1 or', desc_en:'Each 6 in the played combo yields 1 gold',
    onCombo:(id,dice)=>{ const g=dice.filter(d=>d===6).length; if(g){G.gold+=g;toast(t('tProspecteur',{g}),'gold');} },
    apply:(id,chips,mult)=> [chips,mult] },
  { id:'marathonien',  rarity:'uncommon', name:'Le Marathonien', name_en:'The Marathoner', img:IMG('jokers-peu-communs','le-marathonien.png'), cost:5,
    desc:'+2 lancers supplémentaires par main', desc_en:'+2 extra rolls per hand',
    apply:(id,chips,mult)=> [chips,mult] },
  { id:'doyen',        rarity:'uncommon', name:'Le Doyen',       name_en:'The Elder',      img:IMG('jokers-peu-communs','le-doyen.png'),       cost:4,
    desc:'Chaque 1 dans la combo jouée ajoute +5 Chips', desc_en:'Each 1 in the played combo adds +5 Chips',
    apply:(id,chips,mult,dice)=> [chips + dice.filter(d=>d===1).length*5, mult] },
  { id:'jumeaux',      rarity:'uncommon', name:'Les Jumeaux',    name_en:'The Twins',      img:IMG('jokers-peu-communs','les-jumeaux.png'),     cost:5,
    desc:'Paire dans la combo → +15 Chips +1 Mult', desc_en:'Pair in the combo → +15 Chips +1 Mult',
    apply:(id,chips,mult,dice)=> {
      const c = dice.reduce((a,d)=>{a[d]=(a[d]||0)+1;return a;},{});
      return Object.values(c).some(v=>v>=2) ? [chips+15, mult+1] : [chips,mult];
    }},

  // ── RARES ───────────────────────────────────────────────────────
  { id:'dechaine',       rarity:'rare', name:'Le Déchainé',      name_en:'The Unchained',    img:IMG('jokers-rares','le-dechaine.png'),      cost:7,
    desc:'Yahtzee → Mult ×3', desc_en:'Yahtzee → Mult ×3',
    apply:(id,chips,mult)=> id==='yahtzee' ? [chips, mult*3] : [chips,mult] },
  { id:'gambleur',       rarity:'rare', name:'Le Gambleur',       name_en:'The Gambler',      img:IMG('jokers-rares','le-gambleur.png'),      cost:6,
    desc:'Full House compte comme 60 Chips × 5 Mult', desc_en:'Full House counts as 60 Chips × 5 Mult',
    apply:(id,chips,mult)=> id==='fullHouse' ? [60, 5] : [chips,mult] },
  { id:'stratege',       rarity:'rare', name:'Le Stratège',       name_en:'The Strategist',   img:IMG('jokers-rares','le-stratege.png'),      cost:6,
    desc:'Mult ×1.5 sur toutes les combos', desc_en:'Mult ×1.5 on all combos',
    apply:(id,chips,mult)=> [chips, Math.round(mult*1.5)] },
  { id:'perfectionniste',rarity:'rare', name:'Le Perfectionniste', name_en:'The Perfectionist',img:IMG('jokers-rares','le-perfectionniste.png'),cost:6,
    desc:'Carré ou Yahtzee → +4 Mult supplémentaire', desc_en:'Four of a Kind or Yahtzee → +4 extra Mult',
    apply:(id,chips,mult)=> (id==='fourKind'||id==='yahtzee') ? [chips, mult+4] : [chips,mult] },
  { id:'tricheur',       rarity:'rare', name:'Le Tricheur',       name_en:'The Cheater',      img:IMG('jokers-rares','le-tricheur.png'),      cost:6,
    desc:'Grande suite valide avec 4 dés consécutifs au lieu de 5', desc_en:'Large Straight valid with 4 consecutive dice instead of 5',
    apply:(id,chips,mult)=> [chips,mult] },
  { id:'imbattable',     rarity:'rare', name:"L'Imbattable",      name_en:'The Unbeatable',   img:IMG('jokers-rares','limbattable.png'),      cost:7,
    desc:'Joue avec 6 dés au lieu de 5', desc_en:'Play with 6 dice instead of 5',
    apply:(id,chips,mult)=> [chips,mult] },
  { id:'survivant',      rarity:'rare', name:'Le Survivant',      name_en:'The Survivor',     img:IMG('jokers-rares','le-survivant.png'),     cost:6,
    desc:'Si tous les dés retenus ont la même valeur → +5 Mult', desc_en:'If all kept dice share the same value → +5 Mult',
    apply:(id,chips,mult)=> {
      const kVals = G.kept ? G.dice.filter((_,i)=>G.kept[i]) : [];
      const uniq  = [...new Set(kVals)];
      return (kVals.length >= 2 && uniq.length === 1) ? [chips, mult+5] : [chips,mult];
    }},
  { id:'collector',      rarity:'rare', name:'Le Collector',      name_en:'The Collector',    img:IMG('jokers-rares','le-collector.png'),     cost:7,
    desc:'+1 Mult permanent par joker possédé (max +4)', desc_en:'+1 permanent Mult per joker owned (max +4)',
    apply:(id,chips,mult)=> [chips, mult + Math.min(4, Math.max(0, G.jokers.length - 1))] },
  { id:'exploitant',     rarity:'rare', name:"L'Exploitant",      name_en:'The Exploiter',    img:IMG('jokers-rares','lexploitant.png'),      cost:6,
    desc:'Brelan +3💰 · Carré +5💰 · Yahtzee +8💰', desc_en:'Three of a Kind +3💰 · Four of a Kind +5💰 · Yahtzee +8💰',
    onCombo:(id,dice)=>{ const g=id==='threeKind'?3:id==='fourKind'?5:id==='yahtzee'?8:0; if(g){G.gold+=g;toast(t('tMarchand',{g}),'gold');} },
    apply:(id,chips,mult)=> [chips,mult] },
  { id:'bourreau',       rarity:'rare', name:'Le Bourreau',       name_en:'The Executioner',  img:IMG('jokers-rares','le-bourreau.png'),      cost:6,
    desc:'Chaque dé 1 dans la combo ajoute +15 Chips', desc_en:'Each 1 in the combo adds +15 Chips',
    apply:(id,chips,mult,dice)=> [chips + dice.filter(d=>d===1).length*15, mult] },

  // ── LÉGENDAIRES ─────────────────────────────────────────────────
  { id:'alpha',          rarity:'legendary', name:"L'Alpha",           name_en:'The Alpha',         img:IMG('jokers-legendaires','lalpha.png'),          cost:9,
    desc:'+2 Mult sur absolument toutes les combos', desc_en:'+2 Mult on every combo',
    apply:(id,chips,mult)=> [chips, mult+2] },
  { id:'eternal',        rarity:'legendary', name:"L'Éternel",         name_en:'The Eternal',       img:IMG('jokers-legendaires','leternel.png'),         cost:10,
    desc:'Gagne +1 Mult permanent après chaque blind battue (max 8)', desc_en:'+1 permanent Mult after each blind beaten (max 8)',
    state:{ mult:0 },
    onWinBlind:(j)=>{ if(j.state.mult<8) j.state.mult++; },
    apply:(id,chips,mult,dice,kept,j)=> [chips, mult + (j?.state?.mult ?? 0)] },
  { id:'omniscient',     rarity:'legendary', name:"L'Omniscient",      name_en:'The Omniscient',    img:IMG('jokers-legendaires','lomniscient.png'),      cost:9,
    desc:'Si aucun dé n\'est retenu → Mult ×2', desc_en:'If no dice are kept → Mult ×2',
    apply:(id,chips,mult,dice,kept)=> kept === 0 ? [chips, mult*2] : [chips,mult] },
  { id:'dieu-hasard',    rarity:'legendary', name:'Le Dieu du Hasard', name_en:'God of Fortune',    img:IMG('jokers-legendaires','le-dieu-du-hasard.png'),cost:10,
    desc:'Après chaque blind gagnée : +15 Chips OU +2 Mult OU +3💰 (aléatoire)', desc_en:'After each blind won: +15 Chips OR +2 Mult OR +3💰 (random)',
    state:{ chips:0, mult:0 },
    onWinBlind:(j)=>{ const r=Math.floor(Math.random()*3); if(r===0){j.state.chips+=15;toast('+15 Chips (Dieu du Hasard)','chips');}else if(r===1){j.state.mult+=2;toast('+2 Mult (Dieu du Hasard)','mult');}else{G.gold+=3;toast('+3💰 (Dieu du Hasard)','gold');} },
    apply:(id,chips,mult,dice,kept,j)=> [chips+(j?.state?.chips??0), mult+(j?.state?.mult??0)] },
  { id:'multiplicateur', rarity:'legendary', name:'Le Multiplicateur',  name_en:'The Multiplier',    img:IMG('jokers-legendaires','le-multiplicateur.png'),cost:9,
    desc:'Mult ×1.5 sur toutes les combos · Chaque 6 dans la combo ×1.1 Mult en plus', desc_en:'Mult ×1.5 on all combos · Each 6 adds ×1.1 Mult',
    apply:(id,chips,mult,dice)=> [chips, Math.round(mult * 1.5 * Math.pow(1.1, dice.filter(d=>d===6).length))] },
  { id:'createur',       rarity:'legendary', name:'Le Créateur',        name_en:'The Creator',       img:IMG('jokers-legendaires','le-createur.png'),       cost:11,
    desc:'Déverrouille 1 slot joker supplémentaire', desc_en:'Unlocks 1 extra joker slot',
    isCreateur:true,
    apply:(id,chips,mult)=> [chips,mult] },
  { id:'intenable',      rarity:'legendary', name:"L'Intenable",        name_en:'The Unstoppable',   img:IMG('jokers-legendaires','lintenable.png'),        cost:10,
    desc:'+2 Mult par joker possédé (sans limite)', desc_en:'+2 Mult per joker owned (no cap)',
    apply:(id,chips,mult)=> [chips, mult + G.jokers.length * 2] },
  { id:'maitre',         rarity:'legendary', name:'Le Maître du Jeu',   name_en:'Master of the Game',img:IMG('jokers-legendaires','le-maitre-du-jeu.png'),  cost:9,
    desc:'Catégories (As…Six) → Chips doublées', desc_en:'Number categories (Aces…Sixes) → Chips doubled',
    apply:(id,chips,mult)=> ['ones','twos','threes','fours','fives','sixes'].includes(id) ? [chips*2, mult] : [chips,mult] },
  { id:'infini',         rarity:'legendary', name:"L'Infini",           name_en:'The Infinite',      img:IMG('jokers-legendaires','linfini.png'),           cost:11,
    desc:'+3 Chips permanent après chaque combo jouée', desc_en:'+3 permanent Chips after every combo played',
    state:{ chips:0 },
    onCombo:(id,dice,j)=>{ j.state.chips+=3; },
    apply:(id,chips,mult,dice,kept,j)=> [chips+(j?.state?.chips??0), mult] },
  { id:'apotheose',      rarity:'legendary', name:"L'Apothéose",        name_en:'The Apotheosis',    img:IMG('jokers-legendaires','lapotheose.png'),        cost:12,
    desc:'Dernier lancer de la main → Mult ×2', desc_en:'Last roll of the hand → Mult ×2',
    apply:(id,chips,mult)=> G.rollsLeft === 0 ? [chips, mult*2] : [chips,mult] },
];

// ══════════════════════════════════════════════════════════════════
//  MODIFICATEURS (appliqués aléatoirement sur les jokers en boutique)
// ══════════════════════════════════════════════════════════════════
const MODIFIERS = [
  { id:'phantom',   label:'Fantôme',   icon:'👻', prob:0.03, color:'#c4b5fd', costBonus:0,
    isPhantom: true,
    apply:(c,m)=>[c,m] },
  { id:'golden',    label:'Doré',      icon:'✦',  prob:0.09, color:'#fbbf24', costBonus:2,
    apply:(c,m)=>[c+50, m] },
  { id:'amplified', label:'Amplifié',  icon:'⚡',  prob:0.08, color:'#60a5fa', costBonus:3,
    apply:(c,m)=>[c, Math.round(m*1.25)] },
  { id:'lucky',     label:'Étoilé',    icon:'🌠', prob:0.02, color:'#34d399', costBonus:2,
    apply:(c,m)=>[c+20, m+1] },
];

// ══════════════════════════════════════════════════════════════════
//  CONSTELLATIONS (boosters)
// ══════════════════════════════════════════════════════════════════
// Bonus équilibrés : combos faibles = petits bonus, combos fortes = gros bonus
const CONSTELLATIONS = [
  { id:'belier',      name:'Le Bélier',    name_en:'Aries',       img:IMG('constellations','le-belier.png'),      combo:'ones',      bonus:{ chips:12, mult:1 }, desc:'As → +12 Chips +1 Mult',            desc_en:'Aces → +12 Chips +1 Mult' },
  { id:'taureau',     name:'Le Taureau',   name_en:'Taurus',      img:IMG('constellations','le-taureau.png'),     combo:'twos',      bonus:{ chips:12, mult:1 }, desc:'Deux → +12 Chips +1 Mult',           desc_en:'Twos → +12 Chips +1 Mult' },
  { id:'gemeaux',     name:'Les Gémeaux',  name_en:'Gemini',      img:IMG('constellations','les-gemeaux.png'),    combo:'threes',    bonus:{ chips:12, mult:1 }, desc:'Trois → +12 Chips +1 Mult',          desc_en:'Threes → +12 Chips +1 Mult' },
  { id:'cancer',      name:'Le Cancer',    name_en:'Cancer',      img:IMG('constellations','le-cancer.png'),      combo:'fours',     bonus:{ chips:12, mult:1 }, desc:'Quatre → +12 Chips +1 Mult',         desc_en:'Fours → +12 Chips +1 Mult' },
  { id:'lion',        name:'Le Lion',      name_en:'Leo',         img:IMG('constellations','le-lion.png'),        combo:'fives',     bonus:{ chips:12, mult:1 }, desc:'Cinq → +12 Chips +1 Mult',           desc_en:'Fives → +12 Chips +1 Mult' },
  { id:'vierge',      name:'La Vierge',    name_en:'Virgo',       img:IMG('constellations','la-vierge.png'),      combo:'sixes',     bonus:{ chips:12, mult:1 }, desc:'Six → +12 Chips +1 Mult',            desc_en:'Sixes → +12 Chips +1 Mult' },
  { id:'balance',     name:'La Balance',   name_en:'Libra',       img:IMG('constellations','la-balance.png'),     combo:'smStr',     bonus:{ chips:18, mult:1 }, desc:'Petite Suite → +18 Chips +1 Mult',   desc_en:'Small Straight → +18 Chips +1 Mult' },
  { id:'scorpion',    name:'Le Scorpion',  name_en:'Scorpio',     img:IMG('constellations','le-scorpion.png'),    combo:'threeKind', bonus:{ chips:22, mult:1 }, desc:'Brelan → +22 Chips +1 Mult',         desc_en:'Three of a Kind → +22 Chips +1 Mult' },
  { id:'sagittaire',  name:'Le Sagittaire',name_en:'Sagittarius', img:IMG('constellations','le-sagittaire.png'),  combo:'lgStr',     bonus:{ chips:30, mult:2 }, desc:'Grande Suite → +30 Chips +2 Mult',   desc_en:'Large Straight → +30 Chips +2 Mult' },
  { id:'capricorne',  name:'Le Capricorne',name_en:'Capricorn',   img:IMG('constellations','le-capricorne.png'),  combo:'fullHouse', bonus:{ chips:28, mult:2 }, desc:'Full House → +28 Chips +2 Mult',     desc_en:'Full House → +28 Chips +2 Mult' },
  { id:'verseau',     name:'Le Verseau',   name_en:'Aquarius',    img:IMG('constellations','le-verseau.png'),     combo:'fourKind',  bonus:{ chips:38, mult:2 }, desc:'Carré → +38 Chips +2 Mult',          desc_en:'Four of a Kind → +38 Chips +2 Mult' },
  { id:'poissons',    name:'Les Poissons', name_en:'Pisces',      img:IMG('constellations','les-poissons.png'),   combo:'yahtzee',   bonus:{ chips:75, mult:4 }, desc:'Yahtzee → +75 Chips +4 Mult',        desc_en:'Yahtzee → +75 Chips +4 Mult' },
];

const CONSUMABLE_POOL = [
  { id:'oracle',       name:'Oracle',       name_en:'Oracle',       img:IMG('consommables','oracle.png'),       cost:4, desc:'+2 Mult sur toutes les combos pour cette main',              desc_en:'+2 Mult on all combos this hand',             type:'oracle'       },
  { id:'elixir',       name:'Élixir',       name_en:'Elixir',       img:IMG('consommables','elixir.png'),       cost:3, desc:'+1 relance gratuite pour cette main',                        desc_en:'+1 free reroll this hand',                    type:'roll'         },
  { id:'grimoire',     name:'Grimoire',     name_en:'Grimoire',     img:IMG('consommables','grimoire.png'),     cost:5, desc:'Double le score de la prochaine combinaison jouée',            desc_en:"Doubles the next combo's score",              type:'double'       },
  { id:'talisman',     name:'Talisman',     name_en:'Talisman',     img:IMG('consommables','talisman.png'),     cost:4, desc:'Réduit la cible de la blind actuelle de 20%',                 desc_en:'Reduces current blind target by 20%',         type:'acceleration' },
  { id:'bombardment',  name:'Bombardement', name_en:'Bombardment',  img:IMG('consommables','bombardment.png'),  cost:3, desc:"Change un dé au choix en n'importe quelle valeur",            desc_en:'Change one die to any value',                 type:'wild'         },
];

const BOSS_BLINDS = [
  { id:'la-hydre',          name:'La Hydre',          name_en:'The Hydra',       img:IMG('boss-blinds','la-hydre.png'),          desc:'Les dés montrant 1 sont bannis — ils valent 0 et ne comptent pas.',           desc_en:"Dice showing 1 are banned — worth 0 and don't count.",         effect:'ban1'       },
  { id:'le-necromancien',   name:'Le Nécromancien',   name_en:'The Necromancer', img:IMG('boss-blinds','le-necromancien.png'),   desc:'Un joker aléatoire est neutralisé avant chaque lancer. Il se réactive après.', desc_en:'A random joker is disabled before each roll. Reactivates after.',effect:'parasite'   },
  { id:'le-golem',          name:'Le Golem',          name_en:'The Golem',       img:IMG('boss-blinds','le-golem.png'),          desc:'Le score cible est multiplié par 1.8.',                                        desc_en:'The target score is multiplied by 1.8.',                        effect:'bigTarget'  },
  { id:'la-reine-araignee', name:'La Reine Araignée', name_en:'The Spider Queen', img:IMG('boss-blinds','la-reine-araignee.png'),desc:'La combinaison Full House est interdite.',                                      desc_en:'The Full House combination is forbidden.',                      effect:'noFullHouse'},
  { id:'le-devoreur',       name:'Le Dévoreur',       name_en:'The Devourer',    img:IMG('boss-blinds','le-devoreur.png'),       desc:'-1 lancer par main (minimum 1).',                                             desc_en:'-1 roll per hand (minimum 1).',                                 effect:'lessRoll'   },
];

// Cibles par ante [petite, grande, boss] — équilibre revu (difficulté rehaussée)
const ANTE_TARGETS = [
  [  350,   700,  1200],
  [  900,  1800,  3200],
  [ 2200,  4500,  8000],
  [ 5500, 11000, 20000],
  [14000, 28000, 50000],
];

const MAX_JOKERS  = 5;
function getMaxJokers() { return MAX_JOKERS + (G.jokers?.some(j => j.isCreateur) ? 1 : 0); }
const BASE_HANDS  = 4;
const BASE_ROLLS  = 3;
const BASE_GOLD   = 4;

// ══════════════════════════════════════════════════════════════════
//  SEED & RNG
// ══════════════════════════════════════════════════════════════════
let _shopRng = Math.random; // RNG seedé uniquement pour la boutique

function seedToNum(s) {
  let h = 0xDEADBEEF;
  for (const c of s) h = Math.imul(31, h) + c.charCodeAt(0) | 0;
  return h >>> 0;
}

function makeMulberry32(seed) {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function initSeed(seedStr) {
  G.seed   = seedStr.toUpperCase();
  _shopRng = makeMulberry32(seedToNum(seedStr) + G.ante * 1000 + G.blindIdx * 100);
}

function generateSeedString() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ══════════════════════════════════════════════════════════════════
//  AUDIO
// ══════════════════════════════════════════════════════════════════
let audioCtx  = null;
let musicNodes = null;
let melodyTimer = null;
let masterVolume = 0.6; // 0–1

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// ── Musique ambiante ──────────────────────────────────────────────
function startMusic() {
  if (musicNodes) return;
  const ctx = getCtx();
  musicNodes = {};

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.13 * masterVolume, ctx.currentTime);
  master.connect(ctx.destination);
  musicNodes.master = master;

  // Pad grave : La mineur (A1, E2, A2) — simplifié pour moins d'oppression
  const padFreqs = [55, 82.4, 110];
  padFreqs.forEach((freq, i) => {
    const osc  = ctx.createOscillator();
    const filt = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const lfo  = ctx.createOscillator();
    const lfoG = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(500, ctx.currentTime); // filtre plus agressif → son plus sourd

    lfo.frequency.setValueAtTime(0.04 + i * 0.015, ctx.currentTime);
    lfoG.gain.setValueAtTime(freq * 0.003, ctx.currentTime);
    lfo.connect(lfoG); lfoG.connect(osc.frequency); lfo.start();

    gain.gain.setValueAtTime(0.22 / padFreqs.length, ctx.currentTime);
    osc.connect(filt); filt.connect(gain); gain.connect(master);
    osc.start();
    musicNodes[`pad${i}`] = { osc, lfo };
  });

  // Notes mélodiques aléatoires aiguës/graves
  scheduleMelody(ctx, master);
}

// Gamme pentatonique mineure de La : A C D E G
const MELODY_NOTES = [
  110, 130.8, 146.8, 164.8, 196,    // octave 2 — graves
  220, 261.6, 293.7, 329.6, 392,    // octave 3 — medium
  440, 523.3, 587.3, 659.3, 784,    // octave 4 — aigus
  880,                               // octave 5 — ponctuel
];

function scheduleMelody(ctx, master) {
  function fireNote() {
    if (!musicNodes) return;

    const pool = Math.random() < 0.3
      ? MELODY_NOTES.slice(0, 5)     // grave (30%)
      : Math.random() < 0.4
        ? MELODY_NOTES.slice(11)     // aigu (28%)
        : MELODY_NOTES.slice(5, 10); // médium (42%)

    const freq = pool[Math.floor(Math.random() * pool.length)];
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    const filt = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(1800, ctx.currentTime);

    const vol = freq > 500 ? 0.045 : 0.075;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);

    osc.connect(filt); filt.connect(gain); gain.connect(master);
    osc.start();
    osc.stop(ctx.currentTime + 2.5);

    // Prochaine note dans 1.5–4.5 secondes (plus fréquent)
    melodyTimer = setTimeout(fireNote, 1500 + Math.random() * 3000);
  }

  melodyTimer = setTimeout(fireNote, 1500);
}

// ── Son dés sur plateau ───────────────────────────────────────────
function playRollSound() {
  const ctx  = getCtx();
  const now  = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.9 * masterVolume, now);
  master.connect(ctx.destination);

  // Simuler 5 dés qui roulent et frappent le plateau à des moments décalés
  const totalDuration = 0.72; // durée totale du roulement

  for (let d = 0; d < 5; d++) {
    // Chaque dé fait 2-4 impacts pendant le roulement
    const impacts = 2 + Math.floor(Math.random() * 3);
    for (let k = 0; k < impacts; k++) {
      // Impacts distribués sur la durée, le dernier toujours proche de la fin
      const t = k === impacts - 1
        ? now + totalDuration - 0.04 - Math.random() * 0.08 + d * 0.04
        : now + (k / impacts) * (totalDuration * 0.7) + Math.random() * 0.08 + d * 0.03;

      clack(ctx, master, t, k === impacts - 1);
    }
  }
}

function clack(ctx, dest, when, isFinal) {
  // Corps : bruit blanc très court filtré → son de plastique/bois
  const bufLen = Math.floor(ctx.sampleRate * 0.04);
  const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data   = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.2));

  const src  = ctx.createBufferSource();
  const hp   = ctx.createBiquadFilter();
  const bp   = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  src.buffer = buf;
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(600 + Math.random() * 300, when); // moins strident
  bp.type = 'peaking';
  bp.frequency.setValueAtTime(1400 + Math.random() * 500, when); // plus doux
  bp.gain.setValueAtTime(5, when);

  const vol = isFinal ? 0.38 + Math.random() * 0.15 : 0.16 + Math.random() * 0.12; // gain réduit
  gain.gain.setValueAtTime(vol, when);
  gain.gain.exponentialRampToValueAtTime(0.001, when + 0.06);

  src.connect(hp); hp.connect(bp); bp.connect(gain); gain.connect(dest);
  src.start(when);
  src.stop(when + 0.07);

  // Résonance basse courte sur l'impact final (le dé qui s'arrête)
  if (isFinal) {
    const body  = ctx.createOscillator();
    const bodyG = ctx.createGain();
    body.type = 'sine';
    body.frequency.setValueAtTime(200 + Math.random() * 80, when);
    body.frequency.exponentialRampToValueAtTime(80, when + 0.08);
    bodyG.gain.setValueAtTime(0.18, when);
    bodyG.gain.exponentialRampToValueAtTime(0.001, when + 0.1);
    body.connect(bodyG); bodyG.connect(dest);
    body.start(when); body.stop(when + 0.11);
  }
}

// ── Son de score ──────────────────────────────────────────────────
function playScoreSound() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  // Deux notes montantes (quinte) → sensation de validation
  [[880, 0], [1320, 0.1]].forEach(([freq, delay]) => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + delay);
    g.gain.setValueAtTime(0.18 * masterVolume, now + delay);
    g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.35);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(now + delay);
    osc.stop(now + delay + 0.35);
  });
}

// ══════════════════════════════════════════════════════════════════
//  ÉTAT DU JEU
// ══════════════════════════════════════════════════════════════════
let G = {};

const MAX_CONSUMABLES = 2;

function resetGame(seedStr) {
  G = {
    ante:         1,
    blindIdx:     0,
    score:        0,
    target:       0,
    handsLeft:    BASE_HANDS,
    rollsLeft:    BASE_ROLLS,
    gold:         BASE_GOLD,
    jokers:       [],
    consumables:  [],
    dice:         [1,1,1,1,1],
    kept:         [false,false,false,false,false],
    rolling:      false,
    scoring:      false,
    hasRolled:    false,
    bossEffect:   null,
    bannedValue:  null,
    bossOrder:    shuffleArray([...BOSS_BLINDS]),
    doubleNext:   false,
    wildPending:  false,
    oracleActive:     false,
    shopRerollCost:   2,
    shopItems:        { jokers:[], consumables:[], boosters:[] },
    comboBoosts:      {}, // { comboId: { chips, mult } }
    seed:         seedStr || generateSeedString(),
    runHands:     0,
    runScore:     0,
    runYahtzees:  0,
  };
  initSeed(G.seed);
}

// ══════════════════════════════════════════════════════════════════
//  NAVIGATION ÉCRANS
// ══════════════════════════════════════════════════════════════════
const SCREENS = ['screenTitle','screenBlindIntro','screenGame','screenShop','screenGameOver','screenWin'];

function showScreen(id) {
  const prev = SCREENS.find(s => { const el = document.getElementById(s); return el && !el.classList.contains('hidden'); });
  SCREENS.forEach(s => {
    const el = document.getElementById(s);
    if (!el) return;
    if (s === id) {
      el.classList.remove('hidden');
      el.classList.remove('screen-enter');
      void el.offsetWidth; // reflow pour reset animation
      el.classList.add('screen-enter');
    } else {
      el.classList.add('hidden');
      el.classList.remove('screen-enter');
    }
  });
}

// ══════════════════════════════════════════════════════════════════
//  DÉMARRAGE
// ══════════════════════════════════════════════════════════════════
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
  let rafId    = null;

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
  G.handsLeft  = G.bossEffect === 'lessHands' ? Math.max(1, BASE_HANDS - 1) : BASE_HANDS;
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
function applyMirror() {
  if (G.bossEffect !== 'mirror') return;
  const map = {1:6, 3:4, 5:2};
  G.dice = G.dice.map(d => map[d] ?? d);
}

function isBanned(i) {
  return G.hasRolled && G.bossEffect === 'ban1' && G.bannedValue !== null && G.dice[i] === G.bannedValue;
}

function renderDice() {
  const fogActive = G.bossEffect === 'fog';
  const row = document.getElementById('diceRow');
  row.innerHTML = '';
  for (let i = 0; i < 5; i++) {
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
  applyMirror();

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
//  SCORING — Chips × Mult
// ══════════════════════════════════════════════════════════════════
function getEffDice() {
  return G.bossEffect === 'ban1' && G.bannedValue !== null
    ? G.dice.filter(d => d !== G.bannedValue)
    : [...G.dice];
}

function isComboValid(id, effDice) {
  const counts = getCounts(effDice);
  const vals   = Object.values(counts);
  const sum    = effDice.reduce((a,b)=>a+b,0);
  switch (id) {
    case 'ones':      return effDice.some(d=>d===1);
    case 'twos':      return effDice.some(d=>d===2);
    case 'threes':    return effDice.some(d=>d===3);
    case 'fours':     return effDice.some(d=>d===4);
    case 'fives':     return effDice.some(d=>d===5);
    case 'sixes':     return effDice.some(d=>d===6);
    case 'threeKind': return vals.some(c=>c>=3);
    case 'fourKind':  return vals.some(c=>c>=4);
    case 'fullHouse': { const sv=[...vals].sort((a,b)=>a-b); return sv[0]===2&&sv[1]===3; }
    case 'smStr':     return hasSeq(effDice, G.jokers.some(j=>j.id==='raccourci')  ? 3 : 4);
    case 'lgStr':     return hasSeq(effDice, G.jokers.some(j=>j.id==='tricheur') ? 4 : 5);
    case 'yahtzee':   return vals.some(c=>c===5);
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

function getComboResult(id, preview = false) {
  if (G.bossEffect === 'noFullHouse' && id === 'fullHouse') return null;
  const eff = getEffDice();
  if (!isComboValid(id, eff)) return null;
  return computeScore(id, eff, preview);
}

// ══════════════════════════════════════════════════════════════════
//  PANEL COMBOS + PRÉVIEW
// ══════════════════════════════════════════════════════════════════
function renderPreviewPanel() {
  renderCombos();

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

  results.forEach(({ cat, res, blocked }) => {
    const btn = document.createElement('button');
    btn.className = 'combo-btn' +
      (blocked              ? ' blocked'  : '') +
      (!res && !blocked     ? ' disabled' : '') +
      (res && res.total === bestTotal && bestTotal > 0 ? ' best' : '');

    btn.innerHTML = `<span class="cb-name">${jn(cat)}</span>` + (res
      ? `<span class="cb-chips">${res.chips} ${t('chips')}</span><span class="cb-mult">× ${res.mult} ${t('mult')}</span><span class="cb-total">= ${nf(res.total)} ${t('pts')}</span>`
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
  G.jokers.forEach(j => { if (j.onCombo) j.onCombo(id, G.dice); });

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
  const goldGain = G.bossEffect === 'lowGold' ? 2 : 4;
  toast(t('blindBeaten'), 'green');
  G.gold += goldGain;
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

// ══════════════════════════════════════════════════════════════════
//  BOUTIQUE
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
      <div class="si-desc">${jd(item)}</div>
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
      <div class="si-desc">${jd(item)}</div>
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
//  PANEL LATÉRAL (jokers, consommables, stats)
// ══════════════════════════════════════════════════════════════════
function renderSidePanel() {
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
      const canLeft  = slot > 0;
      const canRight = slot < normalWithIdx.length - 1;
      div.className = 'panel-card joker-draggable' + (G.parasiteIdx === gIdx ? ' parasited' : '');
      div.draggable = true;
      div.dataset.slot = slot;
      div.dataset.rarity    = j.rarity || 'common';
      if (j.modifier) div.dataset.modifier = j.modifier.id;
      div.dataset.jokerIdx  = gIdx;
      div.innerHTML = `
        ${j.modifier ? `<div class="pc-mod" style="color:${j.modifier.color}">${j.modifier.icon}</div>` : ''}
        <div class="pc-icon">${jicon(j)}</div>
        <div class="pc-name">${jn(j)}</div>
        <div class="pc-rar">${rarityLabel(j.rarity)}</div>
        <div class="pc-desc">${jd(j)}</div>
        <div class="joker-move-row">
          <button class="joker-move-btn" ${canLeft  ? '' : 'disabled'} title="${t('moveLeft')}">←</button>
          <button class="joker-move-btn" ${canRight ? '' : 'disabled'} title="${t('moveRight')}">→</button>
        </div>`;
      if (j.modifier) div.insertAdjacentHTML('beforeend', modTipHTML(j.modifier));
      div.querySelectorAll('.joker-move-btn').forEach((btn, bi) => {
        btn.addEventListener('click', e => { e.stopPropagation(); moveJoker(gIdx, bi === 0 ? -1 : 1); });
      });
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
      if (j.modifier) div.insertAdjacentHTML('beforeend', modTipHTML(j.modifier));
      pg.appendChild(div);
    });
    ph.appendChild(pg);
    js.appendChild(ph);
  }

  // ── Consommables (slots visuels) ────────────────────────────────
  const cs = document.getElementById('consumablesSlot');
  cs.innerHTML = '';
  const cLabel = cs.closest ? null : null; // compteur géré différemment

  const cGrid = document.createElement('div');
  cGrid.className = 'slot-grid cons-grid';
  for (let i = 0; i < MAX_CONSUMABLES; i++) {
    const c   = G.consumables[i];
    const div = document.createElement('div');
    if (c) {
      div.className = 'panel-card cons-card';
      div.innerHTML = `<div class="pc-icon">${jicon(c)}</div><div class="pc-name">${jn(c)}</div><div class="pc-desc">${jd(c)}</div>`;
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
//  SCORE POPUP + TOASTS
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

// ══════════════════════════════════════════════════════════════════
//  UTILITAIRES
// ══════════════════════════════════════════════════════════════════
const rand  = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function getCounts(dice) {
  return dice.reduce((a, d) => { a[d] = (a[d]||0)+1; return a; }, {});
}

function hasSeq(dice, len) {
  const u = [...new Set(dice)].sort((a,b)=>a-b);
  let streak = 1, best = 1;
  for (let i = 1; i < u.length; i++) {
    streak = u[i] === u[i-1]+1 ? streak+1 : 1;
    if (streak > best) best = streak;
  }
  return best >= len;
}

// ══════════════════════════════════════════════════════════════════
//  BOOSTERS CONSTELLATION
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
  shuffle(pool);
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
      <div class="bc-bonus">${jd(con)}</div>
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
    }, 400);
  }, { once: true });
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
      <div class="bc-bonus">${jd(j)}</div>
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
    }, 400);
  }, { once: true });
}

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
            <span class="er-desc">${jd(j)}</span>
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
          <span class="er-desc">${jd(c)}</span>
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

function shuffle(arr) {
  for (let i = arr.length-1; i > 0; i--) {
    const j = rand(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}


// ══════════════════════════════════════════════════════════════════
//  THÈME + LANGUE (toggles) + i18n bootstrap
// ══════════════════════════════════════════════════════════════════
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('rtd_theme', theme); } catch (e) {}
  document.querySelectorAll('#themeSeg .seg-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.themeVal === theme));
}

function visibleScreenId() {
  return ['screenTitle','screenBlindIntro','screenGame','screenShop','screenGameOver','screenWin']
    .find(id => { const el = document.getElementById(id); return el && !el.classList.contains('hidden'); });
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
