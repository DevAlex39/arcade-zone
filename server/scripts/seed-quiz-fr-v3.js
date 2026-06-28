/**
 * seed-quiz-fr-v3.js
 * Troisième vague — renforce Science & Nature, Géographie, Culture générale.
 * Usage : node server/scripts/seed-quiz-fr-v3.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
if (!process.env.DB_USER) require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const QUESTIONS = [

  // ═══════════════════════════════════════════════════════
  // SCIENCE & NATURE (+30)
  // ═══════════════════════════════════════════════════════
  { cat: 'Science & Nature', type: 'multiple', difficulty: 'easy',
    question: "Quelle planète est la plus proche du Soleil ?",
    correct: "Mercure",
    incorrect: ["Vénus", "Mars", "Terre"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'easy',
    question: "Quel est le composant principal de l'air que nous respirons ?",
    correct: "L'azote (78%)",
    incorrect: ["L'oxygène", "Le dioxyde de carbone", "L'argon"] },

  { cat: 'Science & Nature', type: 'boolean', difficulty: 'easy',
    question: "L'eau bout à 100°C au niveau de la mer.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'easy',
    question: "Quel organe du corps humain filtre le sang ?",
    correct: "Le rein",
    incorrect: ["Le foie", "La rate", "Le pancréas"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'easy',
    question: "Quelle force maintient les planètes en orbite autour du Soleil ?",
    correct: "La gravitation",
    incorrect: ["Le magnétisme", "L'électrostatique", "La force nucléaire"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'easy',
    question: "Quel est le symbole chimique de l'eau ?",
    correct: "H₂O",
    incorrect: ["HO", "H₂O₂", "OH"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'medium',
    question: "Quel scientifique a découvert la pénicilline ?",
    correct: "Alexander Fleming",
    incorrect: ["Louis Pasteur", "Marie Curie", "Robert Koch"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'medium',
    question: "Combien de chromosomes possède une cellule humaine normale ?",
    correct: "46",
    incorrect: ["23", "48", "36"] },

  { cat: 'Science & Nature', type: 'boolean', difficulty: 'medium',
    question: "Marie Curie a remporté deux prix Nobel.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'medium',
    question: "Quel phénomène atmosphérique est mesuré en décibels ?",
    correct: "Le son / le tonnerre",
    incorrect: ["La pression atmosphérique", "La vitesse du vent", "L'humidité"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'medium',
    question: "À quelle température l'eau se transforme-t-elle en glace au niveau de la mer ?",
    correct: "0°C",
    incorrect: ["-5°C", "4°C", "-10°C"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'medium',
    question: "Quel est le gaz responsable de l'effet de serre principalement émis par les activités humaines ?",
    correct: "Le dioxyde de carbone (CO₂)",
    incorrect: ["Le méthane", "L'ozone", "La vapeur d'eau"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'medium',
    question: "Dans quel organe se produit la digestion des protéines ?",
    correct: "L'estomac",
    incorrect: ["Le foie", "L'intestin grêle", "Le pancréas"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'medium',
    question: "Quel est le métal le plus conducteur de l'électricité ?",
    correct: "L'argent",
    incorrect: ["Le cuivre", "L'or", "L'aluminium"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'medium',
    question: "Quelle couche de l'atmosphère nous protège des rayons UV ?",
    correct: "La couche d'ozone (stratosphère)",
    incorrect: ["La troposphère", "La mésosphère", "La thermosphère"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'hard',
    question: "Quel est le principe de la loi de conservation de l'énergie ?",
    correct: "L'énergie ne se crée ni ne se détruit, elle se transforme",
    incorrect: ["L'énergie augmente avec la chaleur", "L'énergie est proportionnelle à la masse", "L'énergie diminue dans un système fermé"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'hard',
    question: "Quel type de rayonnement a la plus courte longueur d'onde ?",
    correct: "Les rayons gamma",
    incorrect: ["Les rayons X", "Les ultraviolets", "Les rayons cosmiques"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'hard',
    question: "Quel est l'élément chimique le plus lourd trouvé naturellement sur Terre ?",
    correct: "L'uranium",
    incorrect: ["Le plutonium", "Le radon", "Le bismuth"] },

  { cat: 'Science & Nature', type: 'boolean', difficulty: 'hard',
    question: "Le cerveau humain consomme environ 20% de l'énergie du corps.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'hard',
    question: "Quelle est la particule subatomique qui n'a pas de charge électrique ?",
    correct: "Le neutron",
    incorrect: ["Le proton", "L'électron", "Le positon"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'hard',
    question: "Qu'est-ce que la bioluminescence ?",
    correct: "La capacité de certains organismes à produire et émettre de la lumière",
    incorrect: ["La réflexion de la lumière par les écailles de poisson", "La phosphorescence de minéraux marins", "La réfraction de la lumière dans l'eau"] },

  { cat: 'Science & Nature', type: 'multiple', difficulty: 'hard',
    question: "Quel phénomène explique que le ciel est bleu ?",
    correct: "La diffusion de Rayleigh",
    incorrect: ["La réfraction de la lumière", "L'absorption par l'ozone", "La réflexion par les nuages"] },

  // ═══════════════════════════════════════════════════════
  // GÉOGRAPHIE (+25)
  // ═══════════════════════════════════════════════════════
  { cat: 'Géographie', type: 'multiple', difficulty: 'easy',
    question: "Quelle est la capitale de l'Espagne ?",
    correct: "Madrid",
    incorrect: ["Barcelone", "Séville", "Valencia"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'easy',
    question: "Sur quel continent se trouve le Sahara ?",
    correct: "L'Afrique",
    incorrect: ["L'Asie", "L'Amérique du Sud", "L'Australie"] },

  { cat: 'Géographie', type: 'boolean', difficulty: 'easy',
    question: "Le Brésil est le plus grand pays d'Amérique du Sud.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'easy',
    question: "Quelle mer se trouve entre l'Europe et l'Afrique du Nord ?",
    correct: "La mer Méditerranée",
    incorrect: ["La mer Rouge", "La mer Noire", "La mer Caspienne"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'easy',
    question: "Quelle est la capitale du Royaume-Uni ?",
    correct: "Londres",
    incorrect: ["Manchester", "Birmingham", "Édimbourg"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'easy',
    question: "Quel est le plus grand océan du monde ?",
    correct: "L'océan Pacifique",
    incorrect: ["L'océan Atlantique", "L'océan Indien", "L'océan Arctique"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'medium',
    question: "Quelle est la plus haute montagne d'Afrique ?",
    correct: "Le Kilimandjaro",
    incorrect: ["Le mont Kenya", "Le Ruwenzori", "L'Atlas"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'medium',
    question: "Dans quel pays se trouve le Machu Picchu ?",
    correct: "Le Pérou",
    incorrect: ["La Bolivie", "Le Mexique", "La Colombie"] },

  { cat: 'Géographie', type: 'boolean', difficulty: 'medium',
    question: "La Nouvelle-Zélande est composée de deux îles principales.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'medium',
    question: "Quel pays possède le plus long littoral au monde ?",
    correct: "Le Canada",
    incorrect: ["La Russie", "L'Indonésie", "La Norvège"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'medium',
    question: "Quelle ville est surnommée la 'Cité des Anges' ?",
    correct: "Los Angeles",
    incorrect: ["Miami", "Las Vegas", "San Francisco"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'medium',
    question: "Sur combien de continents s'étend la Russie ?",
    correct: "2 (Europe et Asie)",
    incorrect: ["1", "3", "4"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'medium',
    question: "Quelle est la capitale de l'Argentine ?",
    correct: "Buenos Aires",
    incorrect: ["Santiago", "Montevideo", "Lima"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'medium',
    question: "Quel fleuve traverse Le Caire ?",
    correct: "Le Nil",
    incorrect: ["Le Tigre", "Le Congo", "Le Zambèze"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'hard',
    question: "Quel est le nom du plus petit océan du monde ?",
    correct: "L'océan Arctique",
    incorrect: ["L'océan Antarctique", "L'océan Indien", "La mer Méditerranée"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'hard',
    question: "Quelle est la capitale de la Mongolie ?",
    correct: "Oulan-Bator",
    incorrect: ["Almaty", "Tachkent", "Bichkek"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'hard',
    question: "Quel pays est bordé par le plus grand nombre de pays voisins ?",
    correct: "La Chine (14 voisins)",
    incorrect: ["La Russie", "Le Brésil", "L'Allemagne"] },

  { cat: 'Géographie', type: 'boolean', difficulty: 'hard',
    question: "L'Équateur traverse le territoire du Brésil.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'hard',
    question: "Quelle est la ville la plus peuplée d'Afrique ?",
    correct: "Lagos (Nigeria)",
    incorrect: ["Le Caire", "Kinshasa", "Johannesburg"] },

  { cat: 'Géographie', type: 'multiple', difficulty: 'hard',
    question: "Quel pays possède le plus grand nombre d'îles au monde ?",
    correct: "La Suède",
    incorrect: ["L'Indonésie", "La Finlande", "Le Canada"] },

  // ═══════════════════════════════════════════════════════
  // CULTURE GÉNÉRALE (+25)
  // ═══════════════════════════════════════════════════════
  { cat: 'Culture générale', type: 'multiple', difficulty: 'easy',
    question: "Quel est le livre le plus vendu de l'histoire après la Bible ?",
    correct: "Don Quichotte de Cervantes",
    incorrect: ["Harry Potter", "Le Petit Prince", "Cent ans de solitude"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'easy',
    question: "Combien de jours compte une année bissextile ?",
    correct: "366",
    incorrect: ["365", "367", "364"] },

  { cat: 'Culture générale', type: 'boolean', difficulty: 'easy',
    question: "Le français est une langue officielle de l'ONU.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'easy',
    question: "Quelle est la couleur obtenue en mélangeant le bleu et le jaune ?",
    correct: "Le vert",
    incorrect: ["L'orange", "Le violet", "Le marron"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'easy',
    question: "Quel est le plus long roman de Victor Hugo ?",
    correct: "Les Misérables",
    incorrect: ["Notre-Dame de Paris", "Les Travailleurs de la mer", "L'Homme qui rit"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'easy',
    question: "Quel pays a offert la Statue de la Liberté aux États-Unis ?",
    correct: "La France",
    incorrect: ["Le Royaume-Uni", "L'Italie", "L'Espagne"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'medium',
    question: "Qui a écrit 'Le Petit Prince' ?",
    correct: "Antoine de Saint-Exupéry",
    incorrect: ["Jules Verne", "Victor Hugo", "Albert Camus"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'medium',
    question: "Quelle est la devise de la France ?",
    correct: "Liberté, Égalité, Fraternité",
    incorrect: ["Unité, Force, Justice", "Travail, Famille, Patrie", "Paix, Liberté, Justice"] },

  { cat: 'Culture générale', type: 'boolean', difficulty: 'medium',
    question: "L'espéranto est une langue artificielle créée à la fin du XIXe siècle.",
    correct: "True", incorrect: ["False"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'medium',
    question: "Quel peintre espagnol est célèbre pour le cubisme ?",
    correct: "Pablo Picasso",
    incorrect: ["Salvador Dalí", "Joan Miró", "Francisco Goya"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'medium',
    question: "Quel est l'instrument à cordes le plus grand de l'orchestre ?",
    correct: "La contrebasse",
    incorrect: ["Le violoncelle", "La harpe", "Le violon"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'medium',
    question: "Combien de langues officielles compte la Suisse ?",
    correct: "4 (allemand, français, italien, romanche)",
    incorrect: ["2", "3", "5"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'medium',
    question: "Quel écrivain français a reçu le prix Nobel de littérature en 1957 ?",
    correct: "Albert Camus",
    incorrect: ["Jean-Paul Sartre", "André Gide", "François Mauriac"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'medium',
    question: "Quel est le symbole chimique du fer ?",
    correct: "Fe",
    incorrect: ["Fr", "Fi", "Fo"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'hard',
    question: "Quel philosophe a écrit 'Ainsi parlait Zarathoustra' ?",
    correct: "Friedrich Nietzsche",
    incorrect: ["Arthur Schopenhauer", "Immanuel Kant", "Georg Hegel"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'hard',
    question: "En quelle année a été inaugurée la Tour Eiffel ?",
    correct: "1889",
    incorrect: ["1900", "1876", "1895"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'hard',
    question: "Quel est le nom de l'opéra le plus célèbre de Mozart ?",
    correct: "La Flûte enchantée",
    incorrect: ["Don Giovanni", "Les Noces de Figaro", "Così fan tutte"] },

  { cat: 'Culture générale', type: 'boolean', difficulty: 'hard',
    question: "Le latin est encore la langue officielle du Vatican.",
    correct: "False", incorrect: ["True"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'hard',
    question: "Quelle organisation internationale a son siège à Genève ?",
    correct: "L'Organisation mondiale de la santé (OMS)",
    incorrect: ["L'UNESCO", "Le FMI", "L'OTAN"] },

  { cat: 'Culture générale', type: 'multiple', difficulty: 'hard',
    question: "Quel auteur français a écrit 'À la recherche du temps perdu' ?",
    correct: "Marcel Proust",
    incorrect: ["Gustave Flaubert", "Émile Zola", "Honoré de Balzac"] },

];

async function main() {
  const pool = await mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'plateforme_jeux',
  });

  console.log('📚 Import questions FR — vague 3 (Science, Géographie, Culture)\n');

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
