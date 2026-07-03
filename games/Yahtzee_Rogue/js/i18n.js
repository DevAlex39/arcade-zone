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
    constellationBox: 'Boîte Constellation', jokerBox: 'Boîte Joker', clickToOpen: 'Cliquez sur la boîte pour l\'ouvrir',
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
    constellationBox: 'Constellation Box', jokerBox: 'Joker Box', clickToOpen: 'Click the box to open it',
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
// Colorise les mots-clés de score dans une description (HTML)
function colorizeStats(s) {
  if (!s) return s;
  return String(s)
    .replace(/\bChips\b/g, '<span class="kw-chips">Chips</span>')
    .replace(/\bMult\b/g,  '<span class="kw-mult">Mult</span>');
}
function jdc(o) { return colorizeStats(jd(o)); }
function nf(n) { return Number(n).toLocaleString(LANG === 'en' ? 'en-US' : 'fr'); }

function applyI18n(root) {
  root = root || document;
  root.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = t(el.getAttribute('data-i18n')); });
  root.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
}
