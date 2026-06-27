require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const cors     = require('cors');
const passport = require('passport');
const path     = require('path');
const bcrypt   = require('bcrypt');

const { pool, testConnection } = require('./config/db');
const { migrate }              = require('./config/migrate');
const { initSocket }           = require('./socket/index');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true },
});

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(passport.initialize());

// ─── Jeux solo — servir les fichiers statiques ────────────────────────────────
const GAMES_BASE = path.resolve(__dirname, '..', 'games'); // → arcade-zone/games/
app.use('/solo/yahtzee-rogue',  express.static(path.join(GAMES_BASE, 'Yahtzee_Rogue')));
app.use('/solo/yahtzee',        express.static(path.join(GAMES_BASE, 'Yahtzee')));
app.use('/solo/motus',          express.static(path.join(GAMES_BASE, 'Motus')));
app.use('/solo/skyjo',          express.static(path.join(GAMES_BASE, 'Skyjo')));
app.use('/solo/petits-chevaux', express.static(path.join(GAMES_BASE, 'Petits_chevaux')));
app.use('/solo/escape',         express.static(path.join(GAMES_BASE, 'Escape')));

// ─── Routes API ───────────────────────────────────────────────────────────────
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/games',  require('./routes/games'));
app.use('/api/rooms',  require('./routes/rooms'));
app.use('/api/admin',  require('./routes/admin'));
app.use('/api/motus',  require('./routes/motus'));

app.get('/api/health', (_, res) => res.json({ ok: true, ts: Date.now() }));

// ─── Socket.io ────────────────────────────────────────────────────────────────
initSocket(io);

// ─── Seed admin ───────────────────────────────────────────────────────────────
async function seedAdmin() {
  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE username=?', ['alexis']);
    if (!rows.length) {
      const hash = await bcrypt.hash('nzen43', 12);
      await pool.query(
        'INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES (?,?,?,?,?,?)',
        ['alexis', 'paillot.alexis.ap@gmail.com', hash, 'Alexis', 'Paillot', 'admin']
      );
      console.log('✅ Compte admin créé : alexis / nzen43');
    }
  } catch (err) {
    console.warn('⚠️  Seed admin ignoré :', err.message);
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`\n🚀 Serveur démarré sur http://localhost:${PORT}`);
  await testConnection();
  await migrate();
  await seedAdmin();
});
