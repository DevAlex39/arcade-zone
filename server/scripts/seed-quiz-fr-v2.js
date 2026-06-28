/**
 * seed-quiz-fr-v2.js
 * Deuxième vague — renforce les catégories faibles en FR.
 * Usage : node server/scripts/seed-quiz-fr-v2.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
if (!process.env.DB_USER) require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const QUESTIONS = [

  // ═══════════════════════════════════════════════════════
  // ANIMAUX (+30)
  // ═══════════════════════════════════════════════════════
  { cat: 'Animaux', type: 'multiple', difficulty: 'easy',
    question: "Quel animal est le symbole de l'Australie ?",
    correct: "Le kangourou",
    incorrect: ["Le koala", "L'émeu", "Le wallaby"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'easy',
    question: "Quel est le plus grand félin du monde ?",
    correct: "Le tigre",
    incorrect: ["Le lion", "Le jaguar", "Le léopard"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'easy',
    question: "Quel animal produit la soie ?",
    correct: "Le ver à soie",
    incorrect: ["L'araignée", "Le scarabée", "La chenille processionnaire"] },

  { cat: 'Animaux', type: 'boolean', difficulty: 'easy',
    question: "Les chauves-souris sont des mammifères.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'easy',
    question: "Combien de bosses a un chameau de Bactriane ?",
    correct: "2",
    incorrect: ["1", "3", "0"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'easy',
    question: "Quel est l'animal terrestre le plus lourd ?",
    correct: "L'éléphant d'Afrique",
    incorrect: ["L'hippopotame", "La girafe", "Le rhinocéros blanc"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'easy',
    question: "Quel oiseau est incapable de voler mais court très vite ?",
    correct: "L'autruche",
    incorrect: ["Le manchot", "Le pingouin", "Le casoar"] },

  { cat: 'Animaux', type: 'boolean', difficulty: 'easy',
    question: "Le requin est un mammifère marin.",
    correct: "False", incorrect: ["True"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'medium',
    question: "Quel animal peut survivre plusieurs semaines sans manger ni boire grâce à ses réserves de graisse ?",
    correct: "Le chameau",
    incorrect: ["Le crocodile", "Le serpent", "L'ours"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'medium',
    question: "Quel est le seul mammifère capable de voler ?",
    correct: "La chauve-souris",
    incorrect: ["L'écureuil volant", "Le colibri", "La raie manta"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'medium',
    question: "Quel animal a la plus longue espérance de vie ?",
    correct: "La palourde d'Islande (quahog)",
    incorrect: ["La tortue des Galapagos", "L'éléphant", "La baleine boréale"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'medium',
    question: "Quelle est la couleur du sang du poulpe ?",
    correct: "Bleu",
    incorrect: ["Rouge", "Vert", "Incolore"] },

  { cat: 'Animaux', type: 'boolean', difficulty: 'medium',
    question: "Le python réticulé est le plus long serpent du monde.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'medium',
    question: "Quel animal est connu pour son cri appelé 'braire' ?",
    correct: "L'âne",
    incorrect: ["Le cheval", "Le mulet", "Le zèbre"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'medium',
    question: "Combien de ventouses possède un bras de poulpe en moyenne ?",
    correct: "Environ 240",
    incorrect: ["Environ 50", "Environ 500", "Environ 1 000"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'medium',
    question: "Quel est l'animal le plus venimeux du monde ?",
    correct: "La méduse de boîte (cuboméduse)",
    incorrect: ["Le cobra royal", "Le scorpion déathstalker", "La pieuvre à anneaux bleus"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'hard',
    question: "Quel est le nom scientifique du lion ?",
    correct: "Panthera leo",
    incorrect: ["Panthera tigris", "Acinonyx jubatus", "Felis silvestris"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'hard',
    question: "Quel oiseau peut mémoriser jusqu'à 1 000 cachettes de nourriture ?",
    correct: "La geai de Steller",
    incorrect: ["Le corbeau", "La pie", "La perruche"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'hard',
    question: "Quel est l'insecte le plus rapide du monde ?",
    correct: "Le taon australien",
    incorrect: ["La libellule", "Le bourdon", "La mouche domestique"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'hard',
    question: "Quelle espèce de requin est la plus dangereuse pour l'homme ?",
    correct: "Le grand requin blanc",
    incorrect: ["Le requin tigre", "Le requin bouledogue", "Le requin marteau"] },

  { cat: 'Animaux', type: 'boolean', difficulty: 'hard',
    question: "Les éléphants sont les seuls animaux qui ne peuvent pas sauter.",
    correct: "False", incorrect: ["True"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'hard',
    question: "Quel mammifère marin peut rester en apnée le plus longtemps ?",
    correct: "Le cachalot (jusqu'à 90 minutes)",
    incorrect: ["La baleine bleue", "Le dauphin", "Le phoque de Weddell"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'hard',
    question: "Comment appelle-t-on le petit du cygne ?",
    correct: "Le cygneau",
    incorrect: ["Le poussin", "Le cygnet", "Le blandin"] },

  // ═══════════════════════════════════════════════════════
  // TÉLÉVISION (+25)
  // ═══════════════════════════════════════════════════════
  { cat: 'Télévision', type: 'multiple', difficulty: 'easy',
    question: "Quelle série met en scène un professeur de lycée devenu fabricant de drogue ?",
    correct: "Breaking Bad",
    incorrect: ["Narcos", "Ozark", "Weeds"] },

  { cat: 'Télévision', type: 'multiple', difficulty: 'easy',
    question: "Dans quelle série retrouve-t-on le personnage de Sherlock Holmes revisité au XXIe siècle (version BBC) ?",
    correct: "Sherlock",
    incorrect: ["Elementary", "Mindhunter", "Luther"] },

  { cat: 'Télévision', type: 'boolean', difficulty: 'easy',
    question: "La série 'The Mandalorian' se déroule dans l'univers Star Wars.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Télévision', type: 'multiple', difficulty: 'easy',
    question: "Quelle série animée se déroule à Springfield ?",
    correct: "Les Simpson",
    incorrect: ["Futurama", "South Park", "Family Guy"] },

  { cat: 'Télévision', type: 'multiple', difficulty: 'easy',
    question: "Dans quelle série joue le personnage de Don Draper, publicitaire des années 60 ?",
    correct: "Mad Men",
    incorrect: ["Suits", "Billions", "Halt and Catch Fire"] },

  { cat: 'Télévision', type: 'multiple', difficulty: 'medium',
    question: "Qui joue le rôle de Walter White dans 'Breaking Bad' ?",
    correct: "Bryan Cranston",
    incorrect: ["Aaron Paul", "Dean Norris", "Bob Odenkirk"] },

  { cat: 'Télévision', type: 'multiple', difficulty: 'medium',
    question: "Dans quelle ville se déroule la série 'Peaky Blinders' ?",
    correct: "Birmingham",
    incorrect: ["Manchester", "Londres", "Liverpool"] },

  { cat: 'Télévision', type: 'multiple', difficulty: 'medium',
    question: "Quel est le prénom du personnage principal de la série 'Dexter' ?",
    correct: "Dexter Morgan",
    incorrect: ["Derek Morgan", "Dexter Mills", "Dexter Hayes"] },

  { cat: 'Télévision', type: 'boolean', difficulty: 'medium',
    question: "La série 'Squid Game' est d'origine sud-coréenne.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Télévision', type: 'multiple', difficulty: 'medium',
    question: "Quel acteur joue Jon Snow dans 'Game of Thrones' ?",
    correct: "Kit Harington",
    incorrect: ["Richard Madden", "Nikolaj Coster-Waldau", "Emilia Clarke"] },

  { cat: 'Télévision', type: 'multiple', difficulty: 'medium',
    question: "Quelle série française suit une famille de la haute bourgeoisie parisienne sur plusieurs générations ?",
    correct: "Versailles",
    incorrect: ["Le Bureau des Légendes", "Engrenages", "Borgia"] },

  { cat: 'Télévision', type: 'multiple', difficulty: 'medium',
    question: "Dans 'The Crown', quelle famille royale est mise en scène ?",
    correct: "La famille royale britannique",
    incorrect: ["La famille royale espagnole", "La famille royale belge", "La famille royale suédoise"] },

  { cat: 'Télévision', type: 'multiple', difficulty: 'hard',
    question: "Combien de saisons compte la série 'The Wire' ?",
    correct: "5",
    incorrect: ["4", "6", "7"] },

  { cat: 'Télévision', type: 'multiple', difficulty: 'hard',
    question: "Quelle série HBO se déroule dans un parc d'attractions futuriste peuplé de robots ?",
    correct: "Westworld",
    incorrect: ["Devs", "Humans", "Black Mirror"] },

  { cat: 'Télévision', type: 'multiple', difficulty: 'hard',
    question: "Dans 'Twin Peaks', qui est l'agent du FBI chargé de l'enquête ?",
    correct: "Dale Cooper",
    incorrect: ["Fox Mulder", "Elliot Stabler", "Jack Crawford"] },

  { cat: 'Télévision', type: 'boolean', difficulty: 'hard',
    question: "La série 'Chernobyl' (HBO, 2019) est une mini-série de 5 épisodes.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Télévision', type: 'multiple', difficulty: 'hard',
    question: "Quel showrunner est derrière 'Breaking Bad' et 'Better Call Saul' ?",
    correct: "Vince Gilligan",
    incorrect: ["David Chase", "Matthew Weiner", "David Simon"] },

  // ═══════════════════════════════════════════════════════
  // INFORMATIQUE (+25)
  // ═══════════════════════════════════════════════════════
  { cat: 'Informatique', type: 'multiple', difficulty: 'easy',
    question: "Que signifie 'CPU' ?",
    correct: "Central Processing Unit",
    incorrect: ["Central Power Unit", "Computer Processing Unit", "Core Processing Unit"] },

  { cat: 'Informatique', type: 'multiple', difficulty: 'easy',
    question: "Quel langage est principalement utilisé pour styliser les pages web ?",
    correct: "CSS",
    incorrect: ["HTML", "JavaScript", "PHP"] },

  { cat: 'Informatique', type: 'boolean', difficulty: 'easy',
    question: "Un octet est composé de 8 bits.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Informatique', type: 'multiple', difficulty: 'easy',
    question: "Quel est le système d'exploitation de Microsoft ?",
    correct: "Windows",
    incorrect: ["macOS", "Linux", "Android"] },

  { cat: 'Informatique', type: 'multiple', difficulty: 'easy',
    question: "Que représente le 'www' dans une adresse web ?",
    correct: "World Wide Web",
    incorrect: ["World Wide Wire", "Web Wide World", "Wide World Web"] },

  { cat: 'Informatique', type: 'multiple', difficulty: 'medium',
    question: "Quel langage de programmation est connu pour sa syntaxe basée sur l'indentation ?",
    correct: "Python",
    incorrect: ["Ruby", "Go", "Kotlin"] },

  { cat: 'Informatique', type: 'multiple', difficulty: 'medium',
    question: "Que signifie SQL ?",
    correct: "Structured Query Language",
    incorrect: ["Simple Query Language", "Standard Query Logic", "Structured Question Language"] },

  { cat: 'Informatique', type: 'multiple', difficulty: 'medium',
    question: "Quel est le rôle principal d'un serveur DNS ?",
    correct: "Traduire les noms de domaine en adresses IP",
    incorrect: ["Stocker des fichiers web", "Sécuriser les connexions HTTPS", "Gérer les emails"] },

  { cat: 'Informatique', type: 'boolean', difficulty: 'medium',
    question: "JavaScript et Java sont le même langage de programmation.",
    correct: "False", incorrect: ["True"] },

  { cat: 'Informatique', type: 'multiple', difficulty: 'medium',
    question: "Qu'est-ce que le 'Cloud Computing' ?",
    correct: "L'utilisation de ressources informatiques à distance via Internet",
    incorrect: ["Un type de processeur", "Un protocole réseau", "Un système de refroidissement pour serveurs"] },

  { cat: 'Informatique', type: 'multiple', difficulty: 'medium',
    question: "Quel framework JavaScript est développé par Facebook (Meta) ?",
    correct: "React",
    incorrect: ["Vue.js", "Angular", "Svelte"] },

  { cat: 'Informatique', type: 'multiple', difficulty: 'medium',
    question: "Que fait la commande 'git commit' ?",
    correct: "Enregistre les modifications dans l'historique du dépôt",
    incorrect: ["Envoie le code sur le serveur distant", "Crée une nouvelle branche", "Fusionne deux branches"] },

  { cat: 'Informatique', type: 'multiple', difficulty: 'hard',
    question: "Quel algorithme de chiffrement est basé sur la factorisation de grands nombres premiers ?",
    correct: "RSA",
    incorrect: ["AES", "SHA-256", "MD5"] },

  { cat: 'Informatique', type: 'multiple', difficulty: 'hard',
    question: "Qu'est-ce qu'une injection SQL ?",
    correct: "Une attaque qui insère du code SQL malveillant dans une requête",
    incorrect: ["Une méthode d'optimisation des requêtes", "Un type de jointure SQL", "Une procédure stockée"] },

  { cat: 'Informatique', type: 'multiple', difficulty: 'hard',
    question: "Quel paradigme de programmation est caractérisé par l'utilisation de fonctions pures sans effets de bord ?",
    correct: "La programmation fonctionnelle",
    incorrect: ["La programmation orientée objet", "La programmation impérative", "La programmation événementielle"] },

  { cat: 'Informatique', type: 'boolean', difficulty: 'hard',
    question: "Le protocole HTTPS utilise le port 443 par défaut.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Informatique', type: 'multiple', difficulty: 'hard',
    question: "Quelle structure de données est utilisée pour implémenter une file de priorité ?",
    correct: "Un tas (heap)",
    incorrect: ["Une pile (stack)", "Une liste chaînée", "Un tableau dynamique"] },

  // ═══════════════════════════════════════════════════════
  // MATHÉMATIQUES (+25)
  // ═══════════════════════════════════════════════════════
  { cat: 'Mathématiques', type: 'multiple', difficulty: 'easy',
    question: "Quel est le résultat de 15² ?",
    correct: "225",
    incorrect: ["200", "250", "180"] },

  { cat: 'Mathématiques', type: 'multiple', difficulty: 'easy',
    question: "Combien font 1 000 × 0 ?",
    correct: "0",
    incorrect: ["1 000", "1", "Infini"] },

  { cat: 'Mathématiques', type: 'boolean', difficulty: 'easy',
    question: "Un nombre négatif multiplié par un nombre négatif donne un résultat positif.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Mathématiques', type: 'multiple', difficulty: 'easy',
    question: "Combien de degrés compte un angle droit ?",
    correct: "90°",
    incorrect: ["45°", "180°", "60°"] },

  { cat: 'Mathématiques', type: 'multiple', difficulty: 'easy',
    question: "Quel est le résultat de 3! (factorielle 3) ?",
    correct: "6",
    incorrect: ["3", "9", "27"] },

  { cat: 'Mathématiques', type: 'multiple', difficulty: 'medium',
    question: "Quelle est la formule de l'aire d'un cercle de rayon r ?",
    correct: "π × r²",
    incorrect: ["2 × π × r", "π × r", "2 × π × r²"] },

  { cat: 'Mathématiques', type: 'multiple', difficulty: 'medium',
    question: "Combien vaut log₁₀(1000) ?",
    correct: "3",
    incorrect: ["10", "100", "1 000"] },

  { cat: 'Mathématiques', type: 'multiple', difficulty: 'medium',
    question: "Quel est le résultat de la suite de Fibonacci après 8, 13 ?",
    correct: "21",
    incorrect: ["18", "24", "26"] },

  { cat: 'Mathématiques', type: 'boolean', difficulty: 'medium',
    question: "La somme des angles d'un quadrilatère est toujours 360°.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Mathématiques', type: 'multiple', difficulty: 'medium',
    question: "Quelle est la dérivée de f(x) = x³ ?",
    correct: "3x²",
    incorrect: ["x²", "3x", "x⁴/4"] },

  { cat: 'Mathématiques', type: 'multiple', difficulty: 'medium',
    question: "Combien y a-t-il de nombres premiers inférieurs à 20 ?",
    correct: "8 (2, 3, 5, 7, 11, 13, 17, 19)",
    incorrect: ["6", "7", "9"] },

  { cat: 'Mathématiques', type: 'multiple', difficulty: 'hard',
    question: "Que représente le nombre 'e' (constante d'Euler) approximativement ?",
    correct: "2,718",
    incorrect: ["3,141", "1,618", "1,414"] },

  { cat: 'Mathématiques', type: 'multiple', difficulty: 'hard',
    question: "Quel théorème relie les trois côtés d'un triangle rectangle ?",
    correct: "Le théorème de Pythagore (a² + b² = c²)",
    incorrect: ["Le théorème de Thalès", "Le théorème de Fermat", "Le théorème de Bernoulli"] },

  { cat: 'Mathématiques', type: 'multiple', difficulty: 'hard',
    question: "Quelle est la valeur de i² en mathématiques complexes ?",
    correct: "-1",
    incorrect: ["1", "i", "0"] },

  { cat: 'Mathématiques', type: 'boolean', difficulty: 'hard',
    question: "Il existe une infinité de nombres premiers.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Mathématiques', type: 'multiple', difficulty: 'hard',
    question: "Quelle est la probabilité d'obtenir deux 6 consécutifs en lançant un dé à 6 faces deux fois ?",
    correct: "1/36",
    incorrect: ["1/6", "1/12", "1/18"] },

  // ═══════════════════════════════════════════════════════
  // SPORT (+25)
  // ═══════════════════════════════════════════════════════
  { cat: 'Sport', type: 'multiple', difficulty: 'easy',
    question: "Combien de joueurs y a-t-il dans une équipe de basketball sur le terrain ?",
    correct: "5",
    incorrect: ["6", "7", "4"] },

  { cat: 'Sport', type: 'multiple', difficulty: 'easy',
    question: "Quel sport se joue avec un volant et des raquettes ?",
    correct: "Le badminton",
    incorrect: ["Le squash", "Le tennis de table", "Le pickleball"] },

  { cat: 'Sport', type: 'boolean', difficulty: 'easy',
    question: "Le rugby à 7 est un sport olympique.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Sport', type: 'multiple', difficulty: 'easy',
    question: "Dans quel sport utilise-t-on des crosses et une balle blanche sur gazon ?",
    correct: "Le golf",
    incorrect: ["Le polo", "Le croquet", "Le hockey"] },

  { cat: 'Sport', type: 'multiple', difficulty: 'easy',
    question: "Quel pays a remporté le plus de Coupes du monde de football ?",
    correct: "Le Brésil (5 titres)",
    incorrect: ["L'Allemagne", "L'Italie", "L'Argentine"] },

  { cat: 'Sport', type: 'multiple', difficulty: 'medium',
    question: "Dans quelle discipline sportive Lance Armstrong a-t-il été déchu de ses 7 titres ?",
    correct: "Le cyclisme (Tour de France)",
    incorrect: ["Le triathlon", "La natation", "L'athlétisme"] },

  { cat: 'Sport', type: 'multiple', difficulty: 'medium',
    question: "Quel est le surnom de Kylian Mbappé ?",
    correct: "Donatello / Kyky",
    incorrect: ["El Bicho", "La Pulga", "CR7"] },

  { cat: 'Sport', type: 'multiple', difficulty: 'medium',
    question: "Combien de points vaut un essai au rugby à XV ?",
    correct: "5 points",
    incorrect: ["3 points", "4 points", "6 points"] },

  { cat: 'Sport', type: 'boolean', difficulty: 'medium',
    question: "Le stade olympique de Berlin a accueilli les Jeux olympiques de 1936.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Sport', type: 'multiple', difficulty: 'medium',
    question: "Quel joueur de basketball est surnommé 'The King' ?",
    correct: "LeBron James",
    incorrect: ["Michael Jordan", "Kobe Bryant", "Shaquille O'Neal"] },

  { cat: 'Sport', type: 'multiple', difficulty: 'medium',
    question: "Quelle nation a remporté le plus de médailles d'or aux Jeux olympiques d'été ?",
    correct: "Les États-Unis",
    incorrect: ["La Russie/URSS", "La Chine", "L'Allemagne"] },

  { cat: 'Sport', type: 'multiple', difficulty: 'hard',
    question: "Quel est le record du monde du 100 m sprint (hommes) ?",
    correct: "9,58 secondes (Usain Bolt, 2009)",
    incorrect: ["9,69 secondes", "9,74 secondes", "9,81 secondes"] },

  { cat: 'Sport', type: 'multiple', difficulty: 'hard',
    question: "En quelle année la France a-t-elle remporté la Coupe du monde de rugby ?",
    correct: "La France n'a jamais remporté la Coupe du monde de rugby",
    incorrect: ["2003", "1999", "2007"] },

  { cat: 'Sport', type: 'multiple', difficulty: 'hard',
    question: "Quel est le plus vieux tournoi de tennis encore en activité ?",
    correct: "Wimbledon (depuis 1877)",
    incorrect: ["Roland-Garros", "l'US Open", "L'Open d'Australie"] },

  { cat: 'Sport', type: 'boolean', difficulty: 'hard',
    question: "Michael Jordan a remporté 6 titres NBA avec les Chicago Bulls.",
    correct: "True", incorrect: ["False"] },

  // ═══════════════════════════════════════════════════════
  // CINÉMA (+25)
  // ═══════════════════════════════════════════════════════
  { cat: 'Cinéma', type: 'multiple', difficulty: 'easy',
    question: "Quel film met en scène un lion prénommé Simba ?",
    correct: "Le Roi Lion",
    incorrect: ["Tarzan", "Mowgli", "Madagascar"] },

  { cat: 'Cinéma', type: 'multiple', difficulty: 'easy',
    question: "Qui joue le rôle de Jack Dawson dans 'Titanic' (1997) ?",
    correct: "Leonardo DiCaprio",
    incorrect: ["Brad Pitt", "Tom Hanks", "Johnny Depp"] },

  { cat: 'Cinéma', type: 'boolean', difficulty: 'easy',
    question: "Steven Spielberg a réalisé 'Jurassic Park'.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Cinéma', type: 'multiple', difficulty: 'easy',
    question: "Dans quel film trouve-t-on la réplique 'Je serai de retour' (I'll be back) ?",
    correct: "Terminator",
    incorrect: ["Robocop", "Predator", "Total Recall"] },

  { cat: 'Cinéma', type: 'multiple', difficulty: 'easy',
    question: "Quel film d'animation Pixar raconte l'histoire d'un robot chargé de nettoyer la Terre ?",
    correct: "WALL-E",
    incorrect: ["Robots", "Monstres Academy", "En avant"] },

  { cat: 'Cinéma', type: 'multiple', difficulty: 'medium',
    question: "Qui a réalisé 'Pulp Fiction' (1994) ?",
    correct: "Quentin Tarantino",
    incorrect: ["Martin Scorsese", "Coen Brothers", "David Fincher"] },

  { cat: 'Cinéma', type: 'multiple', difficulty: 'medium',
    question: "Quel film a remporté l'Oscar du meilleur film en 2020 ?",
    correct: "Parasite",
    incorrect: ["1917", "Joker", "Il était une fois à Hollywood"] },

  { cat: 'Cinéma', type: 'multiple', difficulty: 'medium',
    question: "Dans 'Le Seigneur des Anneaux', quel acteur joue Frodon Sacquet ?",
    correct: "Elijah Wood",
    incorrect: ["Sean Astin", "Ian McKellen", "Viggo Mortensen"] },

  { cat: 'Cinéma', type: 'boolean', difficulty: 'medium',
    question: "Le film 'Interstellar' a été réalisé par Christopher Nolan.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Cinéma', type: 'multiple', difficulty: 'medium',
    question: "Quel acteur joue le rôle du Joker dans le film 'Joker' (2019) ?",
    correct: "Joaquin Phoenix",
    incorrect: ["Heath Ledger", "Jack Nicholson", "Jared Leto"] },

  { cat: 'Cinéma', type: 'multiple', difficulty: 'medium',
    question: "Quelle réalisatrice française a signé le film 'Portrait de la jeune fille en feu' ?",
    correct: "Céline Sciamma",
    incorrect: ["Claire Denis", "Mia Hansen-Løve", "Agnès Varda"] },

  { cat: 'Cinéma', type: 'multiple', difficulty: 'hard',
    question: "Quel film de Kubrick est tourné presque entièrement dans un seul décor (hôtel) ?",
    correct: "Shining",
    incorrect: ["Eyes Wide Shut", "2001 : L'Odyssée de l'espace", "Lolita"] },

  { cat: 'Cinéma', type: 'multiple', difficulty: 'hard',
    question: "Qui a composé la musique d'origine de la saga 'Star Wars' ?",
    correct: "John Williams",
    incorrect: ["Hans Zimmer", "Ennio Morricone", "Howard Shore"] },

  { cat: 'Cinéma', type: 'multiple', difficulty: 'hard',
    question: "Quel est le premier film de la saga James Bond (avec Sean Connery) ?",
    correct: "James Bond contre Dr. No (1962)",
    incorrect: ["Goldfinger", "Bons baisers de Russie", "Opération Tonnerre"] },

  { cat: 'Cinéma', type: 'boolean', difficulty: 'hard',
    question: "Andrei Tarkovski est un réalisateur russe célèbre pour 'Solaris' et 'Stalker'.",
    correct: "True", incorrect: ["False"] },

];

async function main() {
  const pool = await mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'plateforme_jeux',
  });

  console.log('📚 Import questions FR — vague 2 (catégories faibles)\n');

  const [cats] = await pool.query('SELECT id, name_fr FROM quiz_categories');
  const catMap = {};
  for (const c of cats) catMap[c.name_fr] = c.id;

  let inserted = 0, skipped = 0;
  for (const q of QUESTIONS) {
    const catId = catMap[q.cat];
    if (!catId) { console.warn(`  ⚠️  Catégorie inconnue : ${q.cat}`); skipped++; continue; }
    try {
      const [res] = await pool.query(
        'INSERT IGNORE INTO quiz_questions (category_id, type, difficulty, lang, question, correct_answer, incorrect_answers) VALUES (?,?,?,?,?,?,?)',
        [catId, q.type, q.difficulty, 'fr', q.question, q.correct, JSON.stringify(q.incorrect)]
      );
      if (res.affectedRows > 0) inserted++;
      else skipped++;
    } catch (e) {
      console.error(`  ✗ ${q.question.slice(0, 40)}… — ${e.message}`);
      skipped++;
    }
  }

  console.log(`\n✅ ${inserted} questions insérées, ${skipped} ignorées.`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
