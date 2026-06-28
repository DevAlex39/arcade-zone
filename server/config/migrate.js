const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const DB_NAME = process.env.DB_NAME || 'plateforme_jeux';

const TABLES = [
  `CREATE TABLE IF NOT EXISTS users (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    email         VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name    VARCHAR(50),
    last_name     VARCHAR(50),
    role          ENUM('user','admin','guest') DEFAULT 'user',
    google_id     VARCHAR(100),
    avatar_url    VARCHAR(255),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login    TIMESTAMP NULL
  ) CHARACTER SET utf8mb4`,

  `CREATE TABLE IF NOT EXISTS games (
    id              VARCHAR(50) PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    icon            VARCHAR(10),
    color           VARCHAR(20) DEFAULT '#38bdf8',
    min_players     INT DEFAULT 1,
    max_players     INT DEFAULT 1,
    is_active       BOOLEAN DEFAULT TRUE,
    has_multiplayer BOOLEAN DEFAULT FALSE,
    solo_url        VARCHAR(255),
    sort_order      INT DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) CHARACTER SET utf8mb4`,

  `CREATE TABLE IF NOT EXISTS rooms (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    code        VARCHAR(6) UNIQUE NOT NULL,
    game_id     VARCHAR(50) NOT NULL,
    host_id     INT,
    host_name   VARCHAR(50),
    status      ENUM('waiting','playing','finished') DEFAULT 'waiting',
    max_players INT DEFAULT 8,
    settings    JSON,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at  TIMESTAMP NULL,
    finished_at TIMESTAMP NULL,
    FOREIGN KEY (game_id) REFERENCES games(id)
  ) CHARACTER SET utf8mb4`,

  `CREATE TABLE IF NOT EXISTS room_players (
    id        INT PRIMARY KEY AUTO_INCREMENT,
    room_id   INT NOT NULL,
    user_id   INT,
    guest_name VARCHAR(50),
    is_ready  BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
  ) CHARACTER SET utf8mb4`,

  `CREATE TABLE IF NOT EXISTS motus_word_reports (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    word        VARCHAR(20) NOT NULL,
    category    VARCHAR(50) DEFAULT 'tous',
    user_id     INT NULL,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_word_cat (word, category)
  ) CHARACTER SET utf8mb4`,

  `CREATE TABLE IF NOT EXISTS game_sessions (
    id        INT PRIMARY KEY AUTO_INCREMENT,
    user_id   INT,
    game_id   VARCHAR(50),
    room_id   INT,
    score     INT DEFAULT 0,
    result    ENUM('win','loss','draw') NULL,
    metadata  JSON,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) CHARACTER SET utf8mb4`,

  `CREATE TABLE IF NOT EXISTS quiz_categories (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    opentdb_id INT UNIQUE,
    name_fr    VARCHAR(100) NOT NULL,
    name_en    VARCHAR(100) NOT NULL,
    icon       VARCHAR(10) DEFAULT '❓'
  ) CHARACTER SET utf8mb4`,

  `CREATE TABLE IF NOT EXISTS quiz_questions (
    id                INT PRIMARY KEY AUTO_INCREMENT,
    category_id       INT NOT NULL,
    type              ENUM('multiple','boolean') NOT NULL,
    difficulty        ENUM('easy','medium','hard') NOT NULL,
    lang              VARCHAR(2) NOT NULL DEFAULT 'en',
    question          TEXT NOT NULL,
    correct_answer    VARCHAR(500) NOT NULL,
    incorrect_answers JSON NOT NULL,
    FOREIGN KEY (category_id) REFERENCES quiz_categories(id)
  ) CHARACTER SET utf8mb4`,

  `CREATE TABLE IF NOT EXISTS xp_log (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    user_id    INT NOT NULL,
    amount     INT NOT NULL,
    reason     VARCHAR(100) NOT NULL,
    game_id    VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_date (created_at)
  ) CHARACTER SET utf8mb4`,

  `CREATE TABLE IF NOT EXISTS game_history (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    user_id       INT NOT NULL,
    game_id       VARCHAR(50) NOT NULL,
    result        ENUM('win','loss','draw','solo') NOT NULL,
    score         INT NULL,
    players_count INT DEFAULT 1,
    details       JSON NULL,
    played_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_date (user_id, played_at)
  ) CHARACTER SET utf8mb4`,

  `CREATE TABLE IF NOT EXISTS user_daily_challenges (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    user_id        INT NOT NULL,
    challenge_date DATE NOT NULL,
    challenge_id   INT NOT NULL,
    progress       INT DEFAULT 0,
    completed      BOOLEAN DEFAULT FALSE,
    completed_at   TIMESTAMP NULL,
    UNIQUE KEY uk_user_date (user_id, challenge_date)
  ) CHARACTER SET utf8mb4`,

  `CREATE TABLE IF NOT EXISTS quiz_solo_results (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    username        VARCHAR(50) NOT NULL,
    user_id         INT NULL,
    lives_start     INT NOT NULL DEFAULT 5,
    lives_remaining INT NOT NULL DEFAULT 0,
    correct         INT NOT NULL DEFAULT 0,
    total           INT NOT NULL DEFAULT 0,
    difficulty      VARCHAR(20) DEFAULT 'mixed',
    played_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_lives (lives_remaining DESC, correct DESC)
  ) CHARACTER SET utf8mb4`,
];

const GAMES_SEED = [
  ['yahtzee-rogue',  'Roll the Dice Rogue', 'Rogue-like de dés — combine les meilleures mains pour progresser',          '🎲', '#fb923c', 1, 1, 1, 0, '/solo/yahtzee-rogue/', 1],
  ['yahtzee',        'Roll the Dice',       'Le grand classique des dés — solo ou multijoueur jusqu\'à 6',                '🎯', '#f59e0b', 1, 6, 1, 1, '/solo/yahtzee/',       2],
  ['motus',          'Trouve le Mot',       'Trouve le mot mystère — solo ou multijoueur avec vies et combos',            '🔤', '#38bdf8', 1, 8, 1, 1, '/solo/motus/',         3],
  ['skyjo',          'Cell Number',         'Jeu de cartes inspiré de Skyjo — minimise ton score, solo ou multi',         '🃏', '#4ade80', 1, 8, 1, 1, '/solo/skyjo/',         5],
  ['petits-chevaux', 'Petits Chevaux',      'Le grand classique du plateau — 1 à 4 joueurs',                              '🐴', '#a78bfa', 1, 4, 1, 1, '/solo/petits-chevaux/',6],
  ['escape',         'Escape',              'Jeu d\'évasion textuel — résous les énigmes pour t\'échapper',               '🔐', '#fbbf24', 1, 1, 1, 0, '/solo/escape/',        7],
  ['quiz',           'Quiz Zone',           'Testez vos connaissances — solo ou multi jusqu\'à 8 joueurs',                 '🧠', '#8b5cf6', 1, 8, 1, 1, null,                  8],
];

async function migrate() {
  // 1. Créer la base si elle n'existe pas
  const boot = await mysql.createConnection({
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });
  await boot.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await boot.end();

  // 2. Créer les tables
  const { pool } = require('./db');
  for (const sql of TABLES) {
    await pool.query(sql);
  }

  // 3. Seed des jeux (INSERT IGNORE = pas d'erreur si déjà présents)
  for (const g of GAMES_SEED) {
    await pool.query(
      `INSERT IGNORE INTO games (id,name,description,icon,color,min_players,max_players,is_active,has_multiplayer,solo_url,sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      g
    );
  }

  // 4. Mettre à jour les jeux existants qui ont changé
  // Colonnes XP sur users
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0").catch(() =>
    pool.query("ALTER TABLE users ADD COLUMN xp INT DEFAULT 0").catch(() => {})
  );
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS level INT DEFAULT 1").catch(() =>
    pool.query("ALTER TABLE users ADD COLUMN level INT DEFAULT 1").catch(() => {})
  );
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_daily_bonus DATE NULL").catch(() =>
    pool.query("ALTER TABLE users ADD COLUMN last_daily_bonus DATE NULL").catch(() => {})
  );

  await pool.query(`UPDATE games SET has_multiplayer=1, min_players=1, max_players=8 WHERE id='skyjo'`);
  await pool.query(`UPDATE games SET has_multiplayer=1, min_players=1, max_players=4 WHERE id='petits-chevaux'`);
  // Supprimer les anciennes entrées motus séparées si elles existent encore
  await pool.query(`DELETE FROM games WHERE id IN ('motus-solo','motus-multi')`).catch(() => {});

  console.log('✅ Base de données prête (tables + jeux)');
}

module.exports = { migrate };
