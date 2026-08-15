// ═══════════════════════════════════════════════════════════════════
//  FAIS DEVINER ! — cartes (personnages, objets, animaux, expressions)
// ═══════════════════════════════════════════════════════════════════
const WORDS = [
  // Personnages & célébrités
  { fr:'Napoléon', en:'Napoleon' }, { fr:'Harry Potter', en:'Harry Potter' },
  { fr:'Le Père Noël', en:'Santa Claus' }, { fr:'Cléopâtre', en:'Cleopatra' },
  { fr:'Superman', en:'Superman' }, { fr:'Mario', en:'Mario' },
  { fr:'Einstein', en:'Einstein' }, { fr:'Dracula', en:'Dracula' },
  { fr:'Un pirate', en:'A pirate' }, { fr:'Une sirène', en:'A mermaid' },
  { fr:'Un cow-boy', en:'A cowboy' }, { fr:'Sherlock Holmes', en:'Sherlock Holmes' },
  { fr:'Tarzan', en:'Tarzan' }, { fr:'Un zombie', en:'A zombie' },
  { fr:'Astérix', en:'Asterix' }, { fr:'James Bond', en:'James Bond' },
  { fr:'Un chevalier', en:'A knight' }, { fr:'Une momie', en:'A mummy' },
  { fr:'Cendrillon', en:'Cinderella' }, { fr:'Un extraterrestre', en:'An alien' },
  // Métiers
  { fr:'Un pompier', en:'A firefighter' }, { fr:'Un dentiste', en:'A dentist' },
  { fr:'Un magicien', en:'A magician' }, { fr:'Un plombier', en:'A plumber' },
  { fr:'Un chirurgien', en:'A surgeon' }, { fr:'Un facteur', en:'A mailman' },
  { fr:'Un arbitre', en:'A referee' }, { fr:'Un coiffeur', en:'A hairdresser' },
  { fr:'Un astronaute', en:'An astronaut' }, { fr:'Un boulanger', en:'A baker' },
  // Animaux
  { fr:'Un pingouin', en:'A penguin' }, { fr:'Une girafe', en:'A giraffe' },
  { fr:'Un paresseux', en:'A sloth' }, { fr:'Un requin', en:'A shark' },
  { fr:'Un kangourou', en:'A kangaroo' }, { fr:'Une pieuvre', en:'An octopus' },
  { fr:'Un flamant rose', en:'A flamingo' }, { fr:'Un hérisson', en:'A hedgehog' },
  { fr:'Un caméléon', en:'A chameleon' }, { fr:'Une taupe', en:'A mole' },
  // Objets
  { fr:'Un aspirateur', en:'A vacuum cleaner' }, { fr:'Une brosse à dents', en:'A toothbrush' },
  { fr:'Un parapluie', en:'An umbrella' }, { fr:'Un grille-pain', en:'A toaster' },
  { fr:'Des menottes', en:'Handcuffs' }, { fr:'Une boule de bowling', en:'A bowling ball' },
  { fr:'Un télescope', en:'A telescope' }, { fr:'Une tronçonneuse', en:'A chainsaw' },
  { fr:'Un trampoline', en:'A trampoline' }, { fr:'Une baguette magique', en:'A magic wand' },
  { fr:'Un tire-bouchon', en:'A corkscrew' }, { fr:'Des béquilles', en:'Crutches' },
  { fr:'Un déambulateur', en:'A walker' }, { fr:'Une boussole', en:'A compass' },
  { fr:'Un extincteur', en:'A fire extinguisher' }, { fr:'Un hamac', en:'A hammock' },
  // Lieux & événements
  { fr:'La tour Eiffel', en:'The Eiffel Tower' }, { fr:'Un mariage', en:'A wedding' },
  { fr:'Une île déserte', en:'A desert island' }, { fr:'Le pôle Nord', en:'The North Pole' },
  { fr:'Un embouteillage', en:'A traffic jam' }, { fr:'Une salle de sport', en:'A gym' },
  { fr:'Un camping', en:'A campsite' }, { fr:'Les urgences', en:'The emergency room' },
  { fr:'Un parc d\'attractions', en:'An amusement park' }, { fr:'Une croisière', en:'A cruise' },
  // Actions & concepts
  { fr:'Le hoquet', en:'Hiccups' }, { fr:'Un coup de soleil', en:'A sunburn' },
  { fr:'La gueule de bois', en:'A hangover' }, { fr:'Un fou rire', en:'A giggle fit' },
  { fr:'Le télétravail', en:'Working from home' }, { fr:'Une insomnie', en:'Insomnia' },
  { fr:'Un régime', en:'A diet' }, { fr:'La sieste', en:'A nap' },
  { fr:'Un rencard', en:'A date' }, { fr:'Le karaoké', en:'Karaoke' },
  { fr:'Une cure de désintox digitale', en:'A digital detox' }, { fr:'Le covoiturage', en:'Carpooling' },
  { fr:'Un selfie', en:'A selfie' }, { fr:'Une file d\'attente', en:'A queue' },
  { fr:'Le tri des déchets', en:'Recycling' }, { fr:'Un déménagement', en:'Moving out' },
  // Expressions & divers
  { fr:'Poser un lapin', en:'Standing someone up' }, { fr:'Avoir le cafard', en:'Feeling blue' },
  { fr:'Les doigts dans le nez', en:'A piece of cake' }, { fr:'Une nuit blanche', en:'An all-nighter' },
  { fr:'Un poisson d\'avril', en:'An April fool' }, { fr:'Le grand amour', en:'True love' },
  { fr:'Un ronflement', en:'Snoring' }, { fr:'La chair de poule', en:'Goosebumps' },
  { fr:'Un croche-pied', en:'Tripping someone' }, { fr:'Le bouche-à-bouche', en:'Mouth-to-mouth' },
  { fr:'Une déclaration d\'amour', en:'A love confession' }, { fr:'Le baby-foot', en:'Foosball' },
  { fr:'Une bataille de polochons', en:'A pillow fight' }, { fr:'Un château de sable', en:'A sandcastle' },
  { fr:'La pétanque', en:'Petanque' }, { fr:'Un feu de camp', en:'A campfire' },
  { fr:'Une chasse au trésor', en:'A treasure hunt' }, { fr:'Le saut à l\'élastique', en:'Bungee jumping' },
  { fr:'Un igloo', en:'An igloo' }, { fr:'Une avalanche', en:'An avalanche' },
];

module.exports = { WORDS };
