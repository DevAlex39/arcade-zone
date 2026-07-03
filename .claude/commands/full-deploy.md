# full-deploy — Commit, push GitHub et déploiement VPS

Déploiement complet du projet arcade-zone : commit conventionnel → push GitHub → SCP vers VPS selon les fichiers modifiés.

## Infos VPS
- Host : `alexis@213.32.69.211`
- Base distante : `/var/www/arcade/`
- PM2 : `ssh alexis@213.32.69.211 "source ~/.nvm/nvm.sh && pm2 restart arcade"`

## Étapes à suivre

### 1. Analyser les changements
Lance `git -C "D:/Perso/Site web/arcade-zone" status --short` et `git diff --stat` pour voir ce qui a changé. Identifie quels sous-systèmes sont touchés :
- **RDR** : fichiers dans `games/Yahtzee_Rogue/` (game.js, style.css, index.html, review.js)
- **Assets RDR** : `games/Yahtzee_Rogue/assets/` (images cartes)
- **Serveur** : fichiers dans `server/`
- **Images jeux** : `server/public/images/games/`
- **Client Vue** : fichiers dans `client/src/`

### 2. Commit conventionnel
- Stage tout : `git add -A`
- Génère un message de commit clair au format `type(scope): description` basé sur le diff
- Types : `feat`, `fix`, `style`, `refactor`, `chore`
- Exemples de scopes : `rdr`, `server`, `client`, `quiz`, `ui`
- Commite avec co-auteur : `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

### 3. Push GitHub
`git push origin master`

### 4. Déploiement VPS — SCP ciblé

Ne transférer **que** les fichiers réellement modifiés :

**Fichiers RDR individuels** (si game.js / style.css / index.html / review.js changés) :
```
scp "D:\Perso\Site web\arcade-zone\games\Yahtzee_Rogue\<fichier>" alexis@213.32.69.211:/var/www/arcade/games/Yahtzee_Rogue/<fichier>
```

**Assets cartes RDR** (si `assets/` modifié) :
```
scp -r "D:\Perso\Site web\arcade-zone\games\Yahtzee_Rogue\assets\cards" alexis@213.32.69.211:/var/www/arcade/games/Yahtzee_Rogue/assets/
```

**Fichiers serveur** (si `server/` modifié — hors `public/`) :
```
scp "D:\Perso\Site web\arcade-zone\server\<fichier>" alexis@213.32.69.211:/var/www/arcade/server/<fichier>
```
Puis redémarre PM2 : `ssh alexis@213.32.69.211 "source ~/.nvm/nvm.sh && pm2 restart arcade"`

**Images jeux homepage** (si `server/public/images/games/` modifié) :
```
scp "D:\Perso\Site web\arcade-zone\server\public\images\games\*.png" alexis@213.32.69.211:/var/www/arcade/server/public/images/games/
```

**Client Vue** (si `client/src/` modifié) :
- Build d'abord : `npm run build` dans `D:/Perso/Site web/arcade-zone/client/`
- Puis : `scp -r "D:\Perso\Site web\arcade-zone\client\dist\*" alexis@213.32.69.211:/var/www/arcade/client/dist/`

### 5. Résumé final
Affiche un récapitulatif : fichiers commités, ce qui a été déployé, si PM2 a été redémarré.

## Notes importantes
- Les fichiers RDR (game.js, style.css, index.html) sont servis **statiquement** → pas besoin de restart PM2, un refresh navigateur suffit
- Seul `server/` nécessite un restart PM2
- Si l'utilisateur précise des fichiers spécifiques, ne déploie que ceux-là
