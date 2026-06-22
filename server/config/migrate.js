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
];

const GAMES_SEED = [
  ['yahtzee-rogue',  'Roll the Dice Rogue', 'Rogue-like de dés — combine les meilleures mains pour progresser',          '🎲', '#fb923c', 1, 1, 1, 0, '/solo/yahtzee-rogue/', 1],
  ['yahtzee',        'Yahtzee',             'Le grand classique des dés — solo ou multijoueur jusqu\'à 6',                '🎯', '#f59e0b', 1, 6, 1, 1, '/solo/yahtzee/',       2],
  ['motus-solo',     'Trouve le Mot',       'Trouve le mot mystère en 6 essais — solo',                                   '🔤', '#38bdf8', 1, 1, 1, 0, '/solo/motus/',         3],
  ['motus-multi',    'Trouve le Mot',       'Multijoueur — chacun sur son écran, système de vies et combos',              '🔥', '#f472b6', 2, 8, 1, 1, null,                   4],
  ['skyjo',          'Cell Number',         'Jeu de cartes inspiré de Skyjo — minimise ton score, solo ou multi',         '🃏', '#4ade80', 1, 8, 1, 1, '/solo/skyjo/',         5],
  ['petits-chevaux', 'Petits Chevaux',      'Le grand classique du plateau — 1 à 4 joueurs',                              '🐴', '#a78bfa', 1, 4, 1, 1, '/solo/petits-chevaux/',6],
  ['escape',         'Escape',              'Jeu d\'évasion textuel — résous les énigmes pour t\'échapper',               '🔐', '#fbbf24', 1, 1, 1, 0, '/solo/escape/',        7],
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

  // 4. Mettre à jour les jeux existants qui ont changé (has_multiplayer)
  await pool.query(`UPDATE games SET has_multiplayer=1, min_players=1, max_players=8 WHERE id='skyjo'`);
  await pool.query(`UPDATE games SET has_multiplayer=1, min_players=1, max_players=4 WHERE id='petits-chevaux'`);

  console.log('✅ Base de données prête (tables + jeux)');
}

module.exports = { migrate };
