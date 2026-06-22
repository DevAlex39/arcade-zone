-- ─── Plateforme Jeux — Schéma MySQL ──────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS plateforme_jeux CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE plateforme_jeux;

-- Utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  username     VARCHAR(50)  UNIQUE NOT NULL,
  email        VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255),                   -- NULL pour OAuth
  first_name   VARCHAR(50),
  last_name    VARCHAR(50),
  role         ENUM('user','admin') DEFAULT 'user',
  google_id    VARCHAR(100),
  avatar_url   VARCHAR(255),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login   TIMESTAMP NULL
);

-- Registre des jeux
CREATE TABLE IF NOT EXISTS games (
  id              VARCHAR(50) PRIMARY KEY,
  name            VARCHAR(100)  NOT NULL,
  description     TEXT,
  icon            VARCHAR(10),
  color           VARCHAR(20)   DEFAULT '#38bdf8',
  min_players     INT           DEFAULT 1,
  max_players     INT           DEFAULT 1,
  is_active       BOOLEAN       DEFAULT TRUE,
  has_multiplayer BOOLEAN       DEFAULT FALSE,
  solo_url        VARCHAR(255),                  -- URL vers le jeu solo HTML
  sort_order      INT           DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms (salles multijoueur)
CREATE TABLE IF NOT EXISTS rooms (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  code        VARCHAR(6)  UNIQUE NOT NULL,
  game_id     VARCHAR(50) NOT NULL,
  host_id     INT,
  status      ENUM('waiting','playing','finished') DEFAULT 'waiting',
  max_players INT         DEFAULT 8,
  settings    JSON,
  created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  started_at  TIMESTAMP   NULL,
  finished_at TIMESTAMP   NULL,
  FOREIGN KEY (host_id)  REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (game_id)  REFERENCES games(id)
);

-- Joueurs dans une room
CREATE TABLE IF NOT EXISTS room_players (
  id        INT PRIMARY KEY AUTO_INCREMENT,
  room_id   INT NOT NULL,
  user_id   INT NOT NULL,
  is_ready  BOOLEAN   DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_room_user (room_id, user_id),
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Historique des parties
CREATE TABLE IF NOT EXISTS game_sessions (
  id        INT PRIMARY KEY AUTO_INCREMENT,
  user_id   INT,
  game_id   VARCHAR(50),
  room_id   INT,
  score     INT       DEFAULT 0,
  result    ENUM('win','loss','draw') NULL,
  metadata  JSON,
  played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
);

-- ─── Données initiales ───────────────────────────────────────────────────────
INSERT IGNORE INTO games (id, name, description, icon, color, min_players, max_players, is_active, has_multiplayer, solo_url, sort_order) VALUES
  ('yahtzee-rogue',  'Roll the Dice Rogue', 'Rogue-like de dés — combine les meilleures combinaisons pour progresser',         '🎲', '#fb923c', 1, 1, TRUE,  FALSE, '/solo/yahtzee-rogue/', 1),
  ('motus-solo',     'Trouve le Mot',       'Trouve le mot mystère en 6 essais — solo',                                          '🔤', '#38bdf8', 1, 1, TRUE,  FALSE, '/solo/motus/', 2),
  ('motus-multi',    'Trouve le Mot',       'Multijoueur — jusqu\'à 8 joueurs, chacun sur son écran, système de vies et combos', '🔥', '#f472b6', 2, 8, TRUE,  TRUE,  NULL, 3),
  ('skyjo',          'Cell Number',         'Jeu de cartes inspiré de Skyjo — 2 à 8 joueurs',                                    '🃏', '#4ade80', 2, 8, TRUE,  FALSE, '/solo/skyjo/', 4),
  ('petits-chevaux', 'Petits Chevaux',      'Jeu de plateau classique — 2 à 4 joueurs',                                          '🐴', '#a78bfa', 2, 4, TRUE,  FALSE, '/solo/petits-chevaux/', 5),
  ('escape',         'Escape',              'Jeu d\'évasion textuel — résous les énigmes pour t\'échapper',                      '🔐', '#fbbf24', 1, 1, TRUE,  FALSE, '/solo/escape/', 6);
