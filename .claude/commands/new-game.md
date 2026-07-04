# new-game — Créer un nouveau jeu pour Arcade Zone

Guide la création complète d'un jeu dans la plateforme arcade-zone, de la conception à l'intégration (DB, homepage, lobby multi, i18n).

## Étape 1 — Interview (poser les questions manquantes)

Pose ces questions à l'utilisateur, **sauf si la réponse est déjà dans sa demande** :

1. **Mode** : solo, multi, ou les deux ?
2. **Joueurs IA** : est-ce que des IA peuvent remplacer/compléter les joueurs ?
3. **Nom du jeu** (si non indiqué) — nom affiché + id technique kebab-case
4. **Concept de référence** : faut-il reprendre le concept d'un jeu existant (Uno, Skyjo, Times Up…) ?
5. **Règles spécifiques** : variantes, options configurables dans le lobby ?
6. **Logo / images** : un logo est-il fourni (chemin) ? Des images spécifiques sont-elles à intégrer ? Si aucun logo → fallback emoji dans GameCard.
7. **À la fin** : demander s'il y a des choses particulières à ajouter, et poser toi-même les questions qui te semblent nécessaires (nombre min/max de joueurs, condition de victoire, durée cible d'une partie…).

## Étape 2 — Conventions à respecter (par défaut, sans demander)

- **i18n FR/EN** obligatoire : toutes les chaînes via `useI18n.js` (clés `<gameid>.xxx`), FR par défaut
- **Design global arcade-zone** : variables CSS existantes (`--bg-2`, `--bg-3`, `--border`, `--cyan`, `--violet`, `--text`, `--text-2`…), composants `card`, `btn btn-primary/secondary/ghost`, badges
- **Architecture** :
  - Jeu **solo** : dossier `games/<NomJeu>/` (HTML/CSS/JS statique servi en iframe via `solo_url`)
  - Jeu **multi** : logique dans `server/games/<gameid>.js` + events dans `server/socket/index.js` + vue `client/src/views/games/<Nom>MultiGame.vue`
- **Multi = reprendre le lobby existant** :
  - Enregistrer le jeu dans le seed de `server/config/migrate.js` (id, name, icon, modes, min/max players, image_url)
  - Ajouter les paramètres du jeu dans `LobbyView.vue` (bloc `v-if="isHost && room.game_id === '<gameid>'"`)
  - Ajouter le dispatch dans `launchGame()` de `server/socket/index.js`
  - Ajouter le composant dans `GameView.vue`
  - Utiliser `useMultiRoom.js` + `<GameMenu>` + `<PostGameModal>` (fin de partie : rejouer / lobby / accueil)
  - Ajouter le formatage des règles du jeu dans `GameMenu.vue` (computed `rulesList`)
  - Appeler `handleGameOver()` + `enterPostGame(room)` à la fin (jamais `rooms.delete`)
- **XP** : la fin de partie multi passe par `handleGameOver` (rien à faire de plus)
- **Image homepage** : PNG fond transparent dans `server/public/images/games/<gameid>.png`, colonne `image_url` en DB (`/images/games/<gameid>.png`)

## Étape 3 — Implémentation

1. Serveur : `server/games/<gameid>.js` (initGame, logique pure, état public)
2. Socket : events `<gameid>_action` + start dans `launchGame`
3. Migration : seed du jeu dans `migrate.js`
4. Client : vue multi (et/ou jeu solo statique), lobby settings, GameView, i18n
5. Build client (`npm run build` dans `client/`) et vérifier zéro erreur
6. Proposer commit + déploiement VPS (voir skill full-deploy)

## Étape 4 — Checklist finale

- [ ] Le jeu apparaît sur la homepage avec badge Solo/Multi corrects
- [ ] Lobby : paramètres visibles par l'hôte uniquement, `update_settings` envoyé au start
- [ ] Min/max joueurs respectés (`minPlayers` dans `init_room`)
- [ ] FR/EN complet (aucune chaîne en dur)
- [ ] Fin de partie : PostGameModal fonctionne (rejouer/lobby/accueil)
- [ ] Menu hamburger : règles + joueurs + kick
- [ ] Reconnexion en cours de partie (`resendGameState`)
