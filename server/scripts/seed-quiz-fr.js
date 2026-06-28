/**
 * seed-quiz-fr.js
 * Importe ~300 questions françaises natives en DB.
 * Usage : node server/scripts/seed-quiz-fr.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const QUESTIONS = [

  // ═══════════════════════════════════════════════════════
  // GÉOGRAPHIE
  // ═══════════════════════════════════════════════════════
  { cat: 'Géographie', type: 'multiple', difficulty: 'easy',
    question: "Quelle est la capitale de l'Australie ?",
    correct: "Canberra",
    incorrect: ["Sydney", "Melbourne", "Brisbane"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'easy',
    question: "Quel est le plus long fleuve du monde ?",
    correct: "Le Nil",
    incorrect: ["L'Amazone", "Le Mississippi", "Le Yangtsé"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'easy',
    question: "Quel pays possède le plus grand territoire au monde ?",
    correct: "La Russie",
    incorrect: ["Le Canada", "Les États-Unis", "La Chine"] },

  { cat: 'Géographie', type: 'boolean', difficulty: 'easy',
    question: "Paris est la ville la plus peuplée de France.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'easy',
    question: "Combien de départements compte la France métropolitaine ?",
    correct: "96",
    incorrect: ["95", "100", "101"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'medium',
    question: "Quel détroit sépare l'Europe de l'Afrique ?",
    correct: "Le détroit de Gibraltar",
    incorrect: ["Le détroit de Bosphore", "Le détroit de Malacca", "Le détroit de Magellan"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'medium',
    question: "Quelle est la capitale du Canada ?",
    correct: "Ottawa",
    incorrect: ["Toronto", "Montréal", "Vancouver"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'medium',
    question: "Quel est le pays le plus peuplé du monde ?",
    correct: "L'Inde",
    incorrect: ["La Chine", "Les États-Unis", "L'Indonésie"] },

  { cat: 'Géographie', type: 'boolean', difficulty: 'medium',
    question: "Le mont Blanc est le point culminant de l'Union Européenne.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'medium',
    question: "Quelle mer borde la Turquie au nord ?",
    correct: "La mer Noire",
    incorrect: ["La mer Méditerranée", "La mer Égée", "La mer Caspienne"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'medium',
    question: "Quel pays possède le plus grand nombre de lacs au monde ?",
    correct: "Le Canada",
    incorrect: ["La Russie", "La Finlande", "Les États-Unis"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'hard',
    question: "Quelle est la capitale du Kazakhstan ?",
    correct: "Astana",
    incorrect: ["Almaty", "Chymkent", "Karaganda"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'hard',
    question: "Quel est le pays le plus petit du monde ?",
    correct: "Le Vatican",
    incorrect: ["Monaco", "Saint-Marin", "Le Liechtenstein"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'hard',
    question: "Lequel de ces fleuves se jette dans l'océan Arctique ?",
    correct: "L'Ob",
    incorrect: ["Le Danube", "Le Zambèze", "Le Colorado"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'hard',
    question: "Quel pays d'Afrique a la plus grande superficie ?",
    correct: "L'Algérie",
    incorrect: ["Le Soudan", "La République démocratique du Congo", "La Libye"] },

  { cat: 'Géographie', type: 'boolean', difficulty: 'hard',
    question: "La ville de Istanbul est entièrement située en Europe.",
    correct: "False", incorrect: ["True"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'hard',
    question: "Quelle est la monnaie officielle du Japon ?",
    correct: "Le yen",
    incorrect: ["Le yuan", "Le won", "Le ringgit"] },

  // ═══════════════════════════════════════════════════════
  // HISTOIRE
  // ═══════════════════════════════════════════════════════
  { cat: 'Histoire', type: 'multiple', difficulty: 'easy',
    question: "En quelle année la Révolution française a-t-elle débuté ?",
    correct: "1789",
    incorrect: ["1776", "1804", "1815"] },

  { cat: 'Histoire', type: 'multiple', difficulty: 'easy',
    question: "Qui était le premier président de la République française ?",
    correct: "Louis-Napoléon Bonaparte",
    incorrect: ["Adolphe Thiers", "Napoléon Bonaparte", "Charles de Gaulle"] },

  { cat: 'Histoire', type: 'boolean', difficulty: 'easy',
    question: "La Seconde Guerre mondiale s'est terminée en 1945.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Histoire', type: 'multiple', difficulty: 'easy',
    question: "Quel empire a construit le Colisée de Rome ?",
    correct: "L'Empire romain",
    incorrect: ["L'Empire grec", "L'Empire byzantin", "L'Empire ottoman"] },

  { cat: 'Histoire', type: 'multiple', difficulty: 'easy',
    question: "Qui a découvert l'Amérique en 1492 ?",
    correct: "Christophe Colomb",
    incorrect: ["Vasco de Gama", "Ferdinand Magellan", "Amerigo Vespucci"] },

  { cat: 'Histoire', type: 'multiple', difficulty: 'medium',
    question: "Quel roi de France était surnommé 'le Roi-Soleil' ?",
    correct: "Louis XIV",
    incorrect: ["Louis XIII", "Louis XVI", "François Ier"] },

  { cat: 'Histoire', type: 'multiple', difficulty: 'medium',
    question: "En quelle année le mur de Berlin est-il tombé ?",
    correct: "1989",
    incorrect: ["1991", "1985", "1987"] },

  { cat: 'Histoire', type: 'boolean', difficulty: 'medium',
    question: "Napoléon Bonaparte est né en France.",
    correct: "False", incorrect: ["True"] },

  { cat: 'Histoire', type: 'multiple', difficulty: 'medium',
    question: "Quelle guerre a opposé la France et la Prusse en 1870 ?",
    correct: "La guerre franco-prussienne",
    incorrect: ["La guerre de Crimée", "La guerre de Sept Ans", "La guerre de Succession d'Espagne"] },

  { cat: 'Histoire', type: 'multiple', difficulty: 'medium',
    question: "Quel traité a mis fin à la Première Guerre mondiale ?",
    correct: "Le traité de Versailles",
    incorrect: ["Le traité de Paris", "Le traité de Westphalie", "Le traité de Berlin"] },

  { cat: 'Histoire', type: 'multiple', difficulty: 'medium',
    question: "En quelle année la France a-t-elle aboli l'esclavage définitivement ?",
    correct: "1848",
    incorrect: ["1789", "1830", "1871"] },

  { cat: 'Histoire', type: 'multiple', difficulty: 'hard',
    question: "Quel pharaon a fait construire la grande pyramide de Gizeh ?",
    correct: "Khéops",
    incorrect: ["Ramsès II", "Toutânkhamon", "Néfertiti"] },

  { cat: 'Histoire', type: 'multiple', difficulty: 'hard',
    question: "Quelle est l'année de la fondation de Rome selon la tradition ?",
    correct: "753 av. J.-C.",
    incorrect: ["509 av. J.-C.", "476 av. J.-C.", "100 av. J.-C."] },

  { cat: 'Histoire', type: 'multiple', difficulty: 'hard',
    question: "Qui a assassiné Jules César ?",
    correct: "Brutus et Cassius (avec des sénateurs)",
    incorrect: ["Marc Antoine", "Pompée", "Octave"] },

  { cat: 'Histoire', type: 'multiple', difficulty: 'hard',
    question: "Quel empire s'est effondré en 1453 avec la chute de Constantinople ?",
    correct: "L'Empire byzantin",
    incorrect: ["L'Empire romain d'Occident", "L'Empire ottoman", "L'Empire mongol"] },

  { cat: 'Histoire', type: 'boolean', difficulty: 'hard',
    question: "Charles de Gaulle a été le premier président de la Ve République française.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Histoire', type: 'multiple', difficulty: 'hard',
    question: "Quel pays a lancé le premier satellite artificiel, Spoutnik 1, en 1957 ?",
    correct: "L'URSS",
    incorrect: ["Les États-Unis", "La France", "Le Royaume-Uni"] },

  // ═══════════════════════════════════════════════════════
  // SCIENCE & NATURE
  // ═══════════════════════════════════════════════════════
  { cat: 'Science & Nature', type: 'multiple', difficulty: 'easy',
    question: "Quel est le symbole chimique de l'or ?",
    correct: "Au",
    incorrect: ["Or", "Ag", "Fe"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'easy',
    question: "Combien de planètes compte notre système solaire ?",
    correct: "8",
    incorrect: ["9", "7", "10"] },

  { cat: 'Science & Nature', type: 'boolean', difficulty: 'easy',
    question: "La Terre est la troisième planète en partant du Soleil.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'easy',
    question: "Quel gaz les plantes absorbent-elles pour faire la photosynthèse ?",
    correct: "Le dioxyde de carbone (CO₂)",
    incorrect: ["L'oxygène", "L'azote", "L'hydrogène"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'easy',
    question: "Quelle planète est surnommée la 'planète rouge' ?",
    correct: "Mars",
    incorrect: ["Vénus", "Jupiter", "Saturne"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'medium',
    question: "Quel scientifique a formulé la théorie de la relativité générale ?",
    correct: "Albert Einstein",
    incorrect: ["Isaac Newton", "Niels Bohr", "Max Planck"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'medium',
    question: "Quelle est la vitesse de la lumière dans le vide (approximativement) ?",
    correct: "300 000 km/s",
    incorrect: ["150 000 km/s", "450 000 km/s", "3 000 km/s"] },

  { cat: 'Science & Nature', type: 'boolean', difficulty: 'medium',
    question: "L'ADN est une molécule à double hélice.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'medium',
    question: "Quel est l'élément chimique le plus abondant dans l'univers ?",
    correct: "L'hydrogène",
    incorrect: ["L'hélium", "L'oxygène", "Le carbone"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'medium',
    question: "Combien d'os compte le corps humain adulte ?",
    correct: "206",
    incorrect: ["186", "256", "212"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'medium',
    question: "Quelle planète possède le plus grand nombre de lunes connues ?",
    correct: "Saturne",
    incorrect: ["Jupiter", "Uranus", "Neptune"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'hard',
    question: "Quel est le numéro atomique du carbone ?",
    correct: "6",
    incorrect: ["12", "8", "4"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'hard',
    question: "Quelle loi stipule que la pression et le volume d'un gaz sont inversement proportionnels à température constante ?",
    correct: "La loi de Boyle-Mariotte",
    incorrect: ["La loi de Charles", "La loi de Gay-Lussac", "La loi d'Avogadro"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'hard',
    question: "Quel phénomène explique la déviation de la lumière par la gravité ?",
    correct: "La relativité générale",
    incorrect: ["L'effet Doppler", "La diffraction", "La réfraction"] },

  { cat: 'Science & Nature', type: 'boolean', difficulty: 'hard',
    question: "Le soleil est composé principalement d'hélium.",
    correct: "False", incorrect: ["True"] },

  // ═══════════════════════════════════════════════════════
  // SPORT
  // ═══════════════════════════════════════════════════════
  { cat: 'Sport', type: 'multiple', difficulty: 'easy',
    question: "Combien de joueurs compte une équipe de football sur le terrain ?",
    correct: "11",
    incorrect: ["10", "12", "9"] },

  { cat: 'Sport', type: 'multiple', difficulty: 'easy',
    question: "Dans quel sport utilise-t-on un volant ?",
    correct: "Le badminton",
    incorrect: ["Le squash", "Le tennis de table", "Le tennis"] },

  { cat: 'Sport', type: 'boolean', difficulty: 'easy',
    question: "Les Jeux olympiques modernes ont été fondés par Pierre de Coubertin.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Sport', type: 'multiple', difficulty: 'easy',
    question: "Quel pays a remporté la Coupe du monde de football 2018 ?",
    correct: "La France",
    incorrect: ["La Croatie", "La Belgique", "L'Angleterre"] },

  { cat: 'Sport', type: 'multiple', difficulty: 'easy',
    question: "Quelle distance court-on dans un marathon ?",
    correct: "42,195 km",
    incorrect: ["40 km", "45 km", "38 km"] },

  { cat: 'Sport', type: 'multiple', difficulty: 'medium',
    question: "Quel joueur de tennis a remporté le plus de titres en Grand Chelem (hommes) ?",
    correct: "Novak Djokovic",
    incorrect: ["Rafael Nadal", "Roger Federer", "Pete Sampras"] },

  { cat: 'Sport', type: 'multiple', difficulty: 'medium',
    question: "Dans quel sport Usain Bolt est-il champion olympique ?",
    correct: "Athlétisme (sprint)",
    incorrect: ["Cyclisme", "Natation", "Rugby"] },

  { cat: 'Sport', type: 'multiple', difficulty: 'medium',
    question: "Combien de sets faut-il gagner pour remporter un match de tennis en Grand Chelem (hommes) ?",
    correct: "3",
    incorrect: ["2", "4", "5"] },

  { cat: 'Sport', type: 'boolean', difficulty: 'medium',
    question: "Le Tour de France cycliste se déroule chaque année en juillet.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Sport', type: 'multiple', difficulty: 'medium',
    question: "Quel club de football a remporté le plus de Ligues des Champions de l'UEFA ?",
    correct: "Le Real Madrid",
    incorrect: ["FC Barcelone", "AC Milan", "Bayern Munich"] },

  { cat: 'Sport', type: 'multiple', difficulty: 'hard',
    question: "En quelle année la France a-t-elle remporté sa première Coupe du monde de football ?",
    correct: "1998",
    incorrect: ["2000", "2006", "2018"] },

  { cat: 'Sport', type: 'multiple', difficulty: 'hard',
    question: "Quel nageur américain détient le record du plus grand nombre de médailles olympiques ?",
    correct: "Michael Phelps",
    incorrect: ["Mark Spitz", "Ian Thorpe", "Ryan Lochte"] },

  { cat: 'Sport', type: 'multiple', difficulty: 'hard',
    question: "Quelle ville a organisé les premiers Jeux olympiques modernes ?",
    correct: "Athènes",
    incorrect: ["Paris", "Londres", "Rome"] },

  // ═══════════════════════════════════════════════════════
  // CULTURE GÉNÉRALE
  // ═══════════════════════════════════════════════════════
  { cat: 'Culture générale', type: 'multiple', difficulty: 'easy',
    question: "Combien de couleurs compte l'arc-en-ciel ?",
    correct: "7",
    incorrect: ["6", "8", "5"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'easy',
    question: "Quelle est la monnaie officielle de la France ?",
    correct: "L'euro",
    incorrect: ["Le franc", "La livre", "Le dollar"] },

  { cat: 'Culture générale', type: 'boolean', difficulty: 'easy',
    question: "Le mont Everest est le plus haut sommet du monde.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'easy',
    question: "Combien de secondes y a-t-il dans une heure ?",
    correct: "3 600",
    incorrect: ["600", "1 200", "7 200"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'medium',
    question: "Qui a peint la Joconde ?",
    correct: "Léonard de Vinci",
    incorrect: ["Michel-Ange", "Raphaël", "Botticelli"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'medium',
    question: "Quel est le roman le plus vendu de tous les temps (hors Bible) ?",
    correct: "Don Quichotte",
    incorrect: ["Harry Potter", "Le Petit Prince", "Les Misérables"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'medium',
    question: "Quelle est la langue la plus parlée dans le monde ?",
    correct: "Le mandarin",
    incorrect: ["L'anglais", "L'espagnol", "Le hindi"] },

  { cat: 'Culture générale', type: 'boolean', difficulty: 'medium',
    question: "Le diamant est la matière naturelle la plus dure.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'medium',
    question: "Quel instrument de musique possède 88 touches ?",
    correct: "Le piano",
    incorrect: ["L'orgue", "L'accordéon", "Le clavecin"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'hard',
    question: "Quel pays a été le premier à accorder le droit de vote aux femmes ?",
    correct: "La Nouvelle-Zélande",
    incorrect: ["La Suède", "Les États-Unis", "La France"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'hard',
    question: "Quel philosophe grec a été le maître d'Alexandre le Grand ?",
    correct: "Aristote",
    incorrect: ["Platon", "Socrate", "Épicure"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'hard',
    question: "En quelle année a eu lieu le premier appel téléphonique, réalisé par Alexander Graham Bell ?",
    correct: "1876",
    incorrect: ["1865", "1890", "1901"] },

  // ═══════════════════════════════════════════════════════
  // CINÉMA
  // ═══════════════════════════════════════════════════════
  { cat: 'Cinéma', type: 'multiple', difficulty: 'easy',
    question: "Quel film d'animation Disney met en scène un poisson-clown ?",
    correct: "Le Monde de Nemo",
    incorrect: ["Monstres & Cie", "Toy Story", "Ratatouille"] },

  { cat: 'Cinéma', type: 'multiple', difficulty: 'easy',
    question: "Qui réalise la saga Star Wars originale (1977-1983) ?",
    correct: "George Lucas",
    incorrect: ["Steven Spielberg", "James Cameron", "Ridley Scott"] },

  { cat: 'Cinéma', type: 'boolean', difficulty: 'easy',
    question: "Titanic (1997) a remporté 11 Oscars.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Cinéma', type: 'multiple', difficulty: 'easy',
    question: "Quel acteur incarne Iron Man dans le MCU ?",
    correct: "Robert Downey Jr.",
    incorrect: ["Chris Evans", "Chris Hemsworth", "Mark Ruffalo"] },

  { cat: 'Cinéma', type: 'multiple', difficulty: 'medium',
    question: "Qui a réalisé le film 'Inception' (2010) ?",
    correct: "Christopher Nolan",
    incorrect: ["David Fincher", "Denis Villeneuve", "Darren Aronofsky"] },

  { cat: 'Cinéma', type: 'multiple', difficulty: 'medium',
    question: "Quelle actrice a joué Hermione Granger dans la saga Harry Potter ?",
    correct: "Emma Watson",
    incorrect: ["Emma Stone", "Keira Knightley", "Natalie Portman"] },

  { cat: 'Cinéma', type: 'multiple', difficulty: 'medium',
    question: "Quel film a remporté la Palme d'or à Cannes en 2019 ?",
    correct: "Parasite",
    incorrect: ["Portrait de la jeune fille en feu", "Les Misérables", "Once Upon a Time in Hollywood"] },

  { cat: 'Cinéma', type: 'boolean', difficulty: 'medium',
    question: "Le film 'Avatar' (2009) de James Cameron est le film le plus rentable de l'histoire.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Cinéma', type: 'multiple', difficulty: 'hard',
    question: "Quel film de Stanley Kubrick est adapté d'un roman de Stephen King ?",
    correct: "Shining",
    incorrect: ["Orange mécanique", "2001 : L'Odyssée de l'espace", "Full Metal Jacket"] },

  { cat: 'Cinéma', type: 'multiple', difficulty: 'hard',
    question: "Quelle est la première réplique de 'Le Parrain' (1972) ?",
    correct: "\"Je crois en l'Amérique\"",
    incorrect: ["\"Fais-lui une offre qu'il ne peut pas refuser\"", "\"Laisse le pistolet. Prends les cannoli.\"", "\"Chaque fois que j'essayais de sortir, ils me tiraient de nouveau vers eux.\""] },

  { cat: 'Cinéma', type: 'multiple', difficulty: 'hard',
    question: "Quel réalisateur français est à l'origine de la Nouvelle Vague ?",
    correct: "François Truffaut",
    incorrect: ["Jean-Luc Godard", "Claude Chabrol", "Éric Rohmer"] },

  // ═══════════════════════════════════════════════════════
  // MUSIQUE
  // ═══════════════════════════════════════════════════════
  { cat: 'Musique', type: 'multiple', difficulty: 'easy',
    question: "Quel groupe britannique est souvent appelé les 'Fab Four' ?",
    correct: "Les Beatles",
    incorrect: ["Les Rolling Stones", "Queen", "Pink Floyd"] },

  { cat: 'Musique', type: 'multiple', difficulty: 'easy',
    question: "Quel chanteur français est connu pour la chanson 'La Mer' ?",
    correct: "Charles Trenet",
    incorrect: ["Édith Piaf", "Jacques Brel", "Georges Brassens"] },

  { cat: 'Musique', type: 'boolean', difficulty: 'easy',
    question: "Michael Jackson est souvent surnommé le 'Roi de la Pop'.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Musique', type: 'multiple', difficulty: 'easy',
    question: "Combien de cordes possède une guitare classique ?",
    correct: "6",
    incorrect: ["4", "7", "8"] },

  { cat: 'Musique', type: 'multiple', difficulty: 'medium',
    question: "Quel compositeur allemand était sourd quand il a composé sa 9e symphonie ?",
    correct: "Ludwig van Beethoven",
    incorrect: ["Johann Sebastian Bach", "Wolfgang Amadeus Mozart", "Franz Schubert"] },

  { cat: 'Musique', type: 'multiple', difficulty: 'medium',
    question: "Quel artiste français a popularisé le style 'chanson réaliste' avec 'La Vie en rose' ?",
    correct: "Édith Piaf",
    incorrect: ["Juliette Gréco", "Barbara", "Dalida"] },

  { cat: 'Musique', type: 'multiple', difficulty: 'medium',
    question: "Quel groupe suédois a remporté l'Eurovision en 1974 avec 'Waterloo' ?",
    correct: "ABBA",
    incorrect: ["Roxette", "Europe", "Ace of Base"] },

  { cat: 'Musique', type: 'boolean', difficulty: 'medium',
    question: "Daft Punk est un duo musical français.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Musique', type: 'multiple', difficulty: 'hard',
    question: "Quel instrument Jimi Hendrix jouait-il principalement ?",
    correct: "La guitare électrique",
    incorrect: ["La basse", "La batterie", "Le piano"] },

  { cat: 'Musique', type: 'multiple', difficulty: 'hard',
    question: "Quel opéra de Verdi met en scène Violetta Valéry ?",
    correct: "La Traviata",
    incorrect: ["Rigoletto", "Aida", "Otello"] },

  { cat: 'Musique', type: 'multiple', difficulty: 'hard',
    question: "Dans quel pays est né le genre musical 'Bossa Nova' ?",
    correct: "Le Brésil",
    incorrect: ["L'Argentine", "Cuba", "Le Mexique"] },

  // ═══════════════════════════════════════════════════════
  // JEUX VIDÉO
  // ═══════════════════════════════════════════════════════
  { cat: 'Jeux vidéo', type: 'multiple', difficulty: 'easy',
    question: "Quel est le personnage principal de la saga 'The Legend of Zelda' ?",
    correct: "Link",
    incorrect: ["Zelda", "Ganon", "Impa"] },

  { cat: 'Jeux vidéo', type: 'multiple', difficulty: 'easy',
    question: "Quelle société a créé le personnage de Mario ?",
    correct: "Nintendo",
    incorrect: ["Sega", "Sony", "Atari"] },

  { cat: 'Jeux vidéo', type: 'boolean', difficulty: 'easy',
    question: "Minecraft a été créé par le studio suédois Mojang.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Jeux vidéo', type: 'multiple', difficulty: 'easy',
    question: "Dans quel jeu peut-on trouver des Creepers ?",
    correct: "Minecraft",
    incorrect: ["Terraria", "Fortnite", "Roblox"] },

  { cat: 'Jeux vidéo', type: 'multiple', difficulty: 'medium',
    question: "Quel est le jeu vidéo le plus vendu de tous les temps ?",
    correct: "Minecraft",
    incorrect: ["Tetris", "GTA V", "Wii Sports"] },

  { cat: 'Jeux vidéo', type: 'multiple', difficulty: 'medium',
    question: "Dans quelle ville fictive se déroule 'GTA V' ?",
    correct: "Los Santos",
    incorrect: ["Vice City", "Liberty City", "San Fierro"] },

  { cat: 'Jeux vidéo', type: 'multiple', difficulty: 'medium',
    question: "Quel héros est à l'origine du jeu 'The Witcher' ?",
    correct: "Geralt de Riv",
    incorrect: ["Kratos", "Arthur Morgan", "Master Chief"] },

  { cat: 'Jeux vidéo', type: 'boolean', difficulty: 'medium',
    question: "Fortnite Battle Royale est un jeu en accès libre (free-to-play).",
    correct: "True", incorrect: ["False"] },

  { cat: 'Jeux vidéo', type: 'multiple', difficulty: 'hard',
    question: "Quel studio a développé la saga 'Dark Souls' ?",
    correct: "FromSoftware",
    incorrect: ["Bandai Namco", "CD Projekt Red", "Capcom"] },

  { cat: 'Jeux vidéo', type: 'multiple', difficulty: 'hard',
    question: "En quelle année est sorti le premier 'Doom' ?",
    correct: "1993",
    incorrect: ["1991", "1995", "1997"] },

  { cat: 'Jeux vidéo', type: 'multiple', difficulty: 'hard',
    question: "Quel personnage peut-on débloquer en terminant 'The Legend of Zelda: Ocarina of Time' sans perdre une seule vie ?",
    correct: "Il n'y a pas de tel déblocage",
    incorrect: ["Link adulte en tenue dorée", "Sheik jouable", "Ganondorf jouable"] },

  // ═══════════════════════════════════════════════════════
  // ANIMAUX
  // ═══════════════════════════════════════════════════════
  { cat: 'Animaux', type: 'multiple', difficulty: 'easy',
    question: "Quel est le plus grand animal terrestre ?",
    correct: "L'éléphant d'Afrique",
    incorrect: ["L'hippopotame", "La girafe", "Le rhinocéros"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'easy',
    question: "Combien de pattes possède une araignée ?",
    correct: "8",
    incorrect: ["6", "10", "12"] },

  { cat: 'Animaux', type: 'boolean', difficulty: 'easy',
    question: "Les dauphins sont des mammifères.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'easy',
    question: "Quel oiseau est incapable de voler et vit en Antarctique ?",
    correct: "Le manchot",
    incorrect: ["Le pingouin", "L'autruche", "L'émeu"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'medium',
    question: "Quel est l'animal terrestre le plus rapide ?",
    correct: "Le guépard",
    incorrect: ["Le lion", "Le cheval", "L'autruche"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'medium',
    question: "Quelle est la durée de gestation de l'éléphant ?",
    correct: "Environ 22 mois",
    incorrect: ["12 mois", "6 mois", "36 mois"] },

  { cat: 'Animaux', type: 'boolean', difficulty: 'medium',
    question: "Le requin baleine est le plus grand poisson du monde.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'medium',
    question: "Quel insecte peut transporter jusqu'à 50 fois son propre poids ?",
    correct: "La fourmi",
    incorrect: ["L'abeille", "Le scarabée", "La sauterelle"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'hard',
    question: "Quel animal possède les empreintes digitales les plus similaires à celles de l'humain ?",
    correct: "Le koala",
    incorrect: ["Le chimpanzé", "Le gorille", "Le raton laveur"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'hard',
    question: "Quelle espèce d'oiseau peut imiter des centaines de sons, y compris des voix humaines ?",
    correct: "Le perroquet gris du Gabon",
    incorrect: ["Le martin-pêcheur", "La pie", "Le corbeau"] },

  { cat: 'Animaux', type: 'multiple', difficulty: 'hard',
    question: "Combien de cœurs possède une pieuvre ?",
    correct: "3",
    incorrect: ["1", "2", "4"] },

  // ═══════════════════════════════════════════════════════
  // INFORMATIQUE
  // ═══════════════════════════════════════════════════════
  { cat: 'Informatique', type: 'multiple', difficulty: 'easy',
    question: "Que signifie l'acronyme 'HTTP' ?",
    correct: "HyperText Transfer Protocol",
    incorrect: ["High Tech Transfer Protocol", "HyperText Transmission Process", "Hyper Transfer Text Protocol"] },

  { cat: 'Informatique', type: 'multiple', difficulty: 'easy',
    question: "Quel langage de programmation est principalement utilisé pour le développement web côté client ?",
    correct: "JavaScript",
    incorrect: ["Python", "Java", "C++"] },

  { cat: 'Informatique', type: 'boolean', difficulty: 'easy',
    question: "Linux est un système d'exploitation open source.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Informatique', type: 'multiple', difficulty: 'easy',
    question: "Qui a cofondé Apple avec Steve Jobs ?",
    correct: "Steve Wozniak",
    incorrect: ["Bill Gates", "Mark Zuckerberg", "Elon Musk"] },

  { cat: 'Informatique', type: 'multiple', difficulty: 'medium',
    question: "Quel langage est utilisé pour décrire la structure des pages web ?",
    correct: "HTML",
    incorrect: ["CSS", "PHP", "SQL"] },

  { cat: 'Informatique', type: 'multiple', difficulty: 'medium',
    question: "Quelle entreprise a développé le langage Python ?",
    correct: "Python a été créé par Guido van Rossum, pas une entreprise",
    incorrect: ["Microsoft", "Google", "Sun Microsystems"] },

  { cat: 'Informatique', type: 'multiple', difficulty: 'medium',
    question: "Qu'est-ce qu'un algorithme de tri 'quicksort' ?",
    correct: "Un algorithme de tri rapide basé sur la récursivité",
    incorrect: ["Un tri alphabétique", "Un tri par insertion linéaire", "Un tri de base 10"] },

  { cat: 'Informatique', type: 'boolean', difficulty: 'medium',
    question: "Git est un système de contrôle de version distribué.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Informatique', type: 'multiple', difficulty: 'hard',
    question: "Quelle structure de données utilise le principe LIFO ?",
    correct: "La pile (Stack)",
    incorrect: ["La file (Queue)", "Le tableau", "L'arbre binaire"] },

  { cat: 'Informatique', type: 'multiple', difficulty: 'hard',
    question: "Quel protocole est utilisé pour l'envoi de mails ?",
    correct: "SMTP",
    incorrect: ["FTP", "POP3", "IMAP"] },

  { cat: 'Informatique', type: 'multiple', difficulty: 'hard',
    question: "Quelle complexité temporelle a l'algorithme de recherche binaire ?",
    correct: "O(log n)",
    incorrect: ["O(n)", "O(n²)", "O(1)"] },

  // ═══════════════════════════════════════════════════════
  // MATHÉMATIQUES
  // ═══════════════════════════════════════════════════════
  { cat: 'Mathématiques', type: 'multiple', difficulty: 'easy',
    question: "Combien font 7 × 8 ?",
    correct: "56",
    incorrect: ["54", "48", "63"] },

  { cat: 'Mathématiques', type: 'multiple', difficulty: 'easy',
    question: "Quel est le résultat de la racine carrée de 144 ?",
    correct: "12",
    incorrect: ["11", "13", "14"] },

  { cat: 'Mathématiques', type: 'boolean', difficulty: 'easy',
    question: "Le nombre π (pi) est approximativement égal à 3,14.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Mathématiques', type: 'multiple', difficulty: 'easy',
    question: "Combien de côtés a un hexagone ?",
    correct: "6",
    incorrect: ["5", "7", "8"] },

  { cat: 'Mathématiques', type: 'multiple', difficulty: 'medium',
    question: "Quel est le plus petit nombre premier ?",
    correct: "2",
    incorrect: ["1", "3", "0"] },

  { cat: 'Mathématiques', type: 'multiple', difficulty: 'medium',
    question: "Quelle est la somme des angles intérieurs d'un triangle ?",
    correct: "180°",
    incorrect: ["90°", "360°", "270°"] },

  { cat: 'Mathématiques', type: 'multiple', difficulty: 'medium',
    question: "Que vaut 2¹⁰ ?",
    correct: "1 024",
    incorrect: ["512", "2 048", "256"] },

  { cat: 'Mathématiques', type: 'boolean', difficulty: 'medium',
    question: "0 est considéré comme un nombre pair.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Mathématiques', type: 'multiple', difficulty: 'hard',
    question: "Quel mathématicien a introduit la notation 'e' pour la base des logarithmes naturels ?",
    correct: "Leonhard Euler",
    incorrect: ["Carl Friedrich Gauss", "Blaise Pascal", "Isaac Newton"] },

  { cat: 'Mathématiques', type: 'multiple', difficulty: 'hard',
    question: "Quel est le théorème qui stipule qu'il n'existe pas de solution entière à xⁿ + yⁿ = zⁿ pour n > 2 ?",
    correct: "Le dernier théorème de Fermat",
    incorrect: ["Le théorème de Pythagore", "Le théorème de Gödel", "Le théorème de Bayes"] },

  { cat: 'Mathématiques', type: 'multiple', difficulty: 'hard',
    question: "Dans un repère cartésien, quelle est la formule de la distance entre deux points (x₁,y₁) et (x₂,y₂) ?",
    correct: "√((x₂-x₁)² + (y₂-y₁)²)",
    incorrect: ["(x₂-x₁) + (y₂-y₁)", "|x₂-x₁| × |y₂-y₁|", "√((x₂+x₁)² + (y₂+y₁)²)"] },

  // ═══════════════════════════════════════════════════════
  // TÉLÉVISION
  // ═══════════════════════════════════════════════════════
  { cat: 'Télévision', type: 'multiple', difficulty: 'easy',
    question: "Dans quelle série télévisée retrouve-t-on les personnages Ross, Rachel, Monica, Chandler, Joey et Phoebe ?",
    correct: "Friends",
    incorrect: ["How I Met Your Mother", "Seinfeld", "The Office"] },

  { cat: 'Télévision', type: 'multiple', difficulty: 'easy',
    question: "Quelle série française suit les aventures d'un gentleman-cambrioleur du XXIe siècle ?",
    correct: "Lupin",
    incorrect: ["Engrenages", "Baron Noir", "Plan Cœur"] },

  { cat: 'Télévision', type: 'boolean', difficulty: 'easy',
    question: "Game of Thrones est basée sur la saga littéraire 'Le Trône de Fer' de George R.R. Martin.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Télévision', type: 'multiple', difficulty: 'easy',
    question: "Dans 'Breaking Bad', quel est le métier de Walter White au début de la série ?",
    correct: "Professeur de chimie",
    incorrect: ["Pharmacien", "Médecin", "Ingénieur"] },

  { cat: 'Télévision', type: 'multiple', difficulty: 'medium',
    question: "Combien de saisons compte la série 'Game of Thrones' ?",
    correct: "8",
    incorrect: ["6", "7", "9"] },

  { cat: 'Télévision', type: 'multiple', difficulty: 'medium',
    question: "Quelle plateforme a produit la série 'Stranger Things' ?",
    correct: "Netflix",
    incorrect: ["HBO", "Amazon Prime", "Disney+"] },

  { cat: 'Télévision', type: 'multiple', difficulty: 'medium',
    question: "Dans 'The Office' (version américaine), dans quelle ville fictive se trouve Dunder Mifflin ?",
    correct: "Scranton",
    incorrect: ["Stamford", "Buffalo", "Albany"] },

  { cat: 'Télévision', type: 'boolean', difficulty: 'medium',
    question: "La série 'The Wire' a été diffusée sur la chaîne HBO.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Télévision', type: 'multiple', difficulty: 'hard',
    question: "Quel acteur joue le rôle de Tony Soprano dans la série 'Les Soprano' ?",
    correct: "James Gandolfini",
    incorrect: ["Steve Buscemi", "Michael Imperioli", "Edie Falco"] },

  { cat: 'Télévision', type: 'multiple', difficulty: 'hard',
    question: "Dans quelle série peut-on voir l'agent Dale Cooper enquêter sur la mort de Laura Palmer ?",
    correct: "Twin Peaks",
    incorrect: ["X-Files", "True Detective", "Mindhunter"] },

  { cat: 'Télévision', type: 'multiple', difficulty: 'hard',
    question: "Quel créateur est derrière les séries 'Lost' et 'Westworld' ?",
    correct: "J.J. Abrams (pour Lost) / Jonathan Nolan & Lisa Joy (pour Westworld)",
    incorrect: ["David Chase", "Vince Gilligan", "David Benioff"] },
];

async function main() {
  const pool = await mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'plateforme_jeux',
    multipleStatements: false,
  });

  console.log('📚 Import questions FR natives\n');

  // Charger les catégories
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

  console.log(`\n✅ ${inserted} questions insérées, ${skipped} ignorées (doublons ou erreurs).`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
