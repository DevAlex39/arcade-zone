# Arcade Zone — Plateforme de jeux

Plateforme multijoueur temps réel : Vue 3 + Express + Socket.io + MySQL.

## Prérequis

- [Node.js LTS](https://nodejs.org) (v20+)
- [MySQL Community Server](https://dev.mysql.com/downloads/mysql/) (v8+)

## Installation

### 1. Base de données

```sql
-- Dans MySQL Workbench ou en ligne de commande :
SOURCE C:/Users/Alexis/Desktop/Site web/Plateforme_Jeux/database/schema.sql
```

### 2. Variables d'environnement

```bash
copy .env.example .env
# Puis éditer .env avec vos valeurs (DB_PASSWORD, JWT_SECRET, etc.)
```

### 3. Dépendances

```bash
npm run install:all
```

### 4. Lancer le projet

```bash
npm run dev
# → Client  : http://localhost:5173
# → Serveur : http://localhost:3000
```

## Compte admin

Créé automatiquement au premier démarrage :
- **Login** : `alexis`
- **Mot de passe** : `nzen43`

## Architecture

```
client/          Vue 3 + Vite + Pinia + Vue Router
server/          Node.js + Express + Socket.io
database/        Schéma MySQL
```

## Jeux disponibles

| Jeu | Mode | Description |
|-----|------|-------------|
| Roll the Dice Rogue | Solo | Rogue-like de dés |
| Trouve le Mot | Solo | Wordle français |
| Trouve le Mot | Multi ⚡ | Multijoueur socket temps réel |
| Cell Number | Solo | Inspiré de Skyjo |
| Petits Chevaux | Solo | Plateau classique |
| Escape | Solo | Aventure textuelle |

## Google OAuth (optionnel)

1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Créer un projet → Activer "Google+ API"
3. Créer des identifiants OAuth 2.0
4. Ajouter l'URI de redirection : `http://localhost:3000/api/auth/google/callback`
5. Copier CLIENT_ID et CLIENT_SECRET dans `.env`
