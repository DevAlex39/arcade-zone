# 🟥 Motus

Jeu de mots à la Motus en HTML/CSS/JS pur. Mots français à 6 lettres.

## Fonctionnalités

- Mot généré aléatoirement via API
- Vérification des propositions sur 3 sources (trouve-mot.fr → Wiktionnaire → liste locale)
- Retour visuel : lettre bien placée / présente / absente
- 6 tentatives maximum

## Structure

```
index.html   — interface du jeu
style.css    — thème sombre
game.js      — logique, appels API, validation
```

## Lancer

Ouvrez `index.html` dans un navigateur. Requiert une connexion internet pour la validation des mots.

## Commandes Git utiles

```bash
git clone https://github.com/[votre-pseudo]/motus.git

git add .
git commit -m "Description de la modification"
git push
```
