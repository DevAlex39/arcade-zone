'use strict';

// ══════════════════════════════════════════════════════════════════
//  DONNÉES DE JEU — combos, jokers, constellations, boss, cibles
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

function cn(id) { const c = COMBOS.find(x => x.id === id); return c ? jn(c) : ''; }

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
  { id:'alchimiste',   rarity:'uncommon', name:"L'Alchimiste",   name_en:'The Alchemist',  img:IMG('jokers-peu-communs','lalchimiste.png'),     cost:4,
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

  // ── ÉPHÉMÈRES (se consument après N mains jouées) ───────────────
  { id:'etoile-filante', rarity:'uncommon', name:"L'Étoile Filante", name_en:'The Shooting Star', icon:'☄️', cost:3, hands:4,
    desc:'+60 Chips sur chaque combo · Se consume après 4 mains', desc_en:'+60 Chips on every combo · Burns out after 4 hands',
    apply:(id,chips,mult)=> [chips+60, mult] },
  { id:'feu-de-paille',  rarity:'rare',     name:'Le Feu de Paille', name_en:'The Straw Fire',    icon:'🔥', cost:5, hands:3,
    desc:'Mult ×2.5 sur toutes les combos · Se consume après 3 mains', desc_en:'Mult ×2.5 on all combos · Burns out after 3 hands',
    apply:(id,chips,mult)=> [chips, Math.round(mult*2.5)] },
  { id:'supernova',      rarity:'legendary', name:'La Supernova',    name_en:'The Supernova',     icon:'💥', cost:7, hands:2,
    desc:'Mult ×4 sur toutes les combos · Se consume après 2 mains', desc_en:'Mult ×4 on all combos · Burns out after 2 hands',
    apply:(id,chips,mult)=> [chips, mult*4] },

  // ── LÉGENDAIRES ─────────────────────────────────────────────────
  { id:'alpha',          rarity:'legendary', name:"L'Alpha",           name_en:'The Alpha',         img:IMG('jokers-legendaires','lalpha.png'),          cost:9,
    desc:'+4 Mult sur absolument toutes les combos', desc_en:'+4 Mult on every combo',
    apply:(id,chips,mult)=> [chips, mult+4] },
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
  { id:'la-brume',          name:'La Brume',          name_en:'The Mist',        icon:'🌫️',                                       desc:'À chaque lancer, 2 dés relancés sont voilés jusqu\'à la soumission. Les dés gardés restent visibles.', desc_en:'Each roll, 2 rerolled dice are veiled until you submit. Kept dice stay visible.', effect:'fog'        },
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
