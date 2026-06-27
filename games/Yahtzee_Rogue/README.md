# 🎲 Yahtzee Rogue

Un roguelike de dés en HTML/CSS/JS pur, inspiré des mécaniques de jeux de cartes roguelike.

## Concept

Battez une série de **blinds** en cumulant des points via des combinaisons de dés Yahtzee.
Chaque avancée débloque une boutique où acheter des **jokers**, des **consommables** et des **boîtes constellation**.

## Fonctionnalités

### Progression
- **5 antes × 3 blinds** (Petite → Grande → Boss) avec cibles de score progressives
- **6 boss blinds** mélangés aléatoirement à chaque run :
  - 👁️ Le Cyclope — les dés montrant 1 ne comptent pas
  - 🐍 Le Serpent — la combo Chance est interdite
  - 🗡️ Le Tyran — −1 lancer par main
  - 🌫️ La Brume — valeurs des dés cachées jusqu'à la soumission
  - 🕳️ Le Gouffre — cible ×1.8
  - 🪞 Le Miroir — les dés impairs sont inversés (1↔6, 3↔4, 5↔2)

### Système de score
- **Chips × Mult** — score = `Chips × Multiplicateur`, affiché en temps réel
- Preview de la meilleure combo disponible après chaque lancer
- 4 mains par blind, 3 lancers par main (modifiables par jokers)

### Jokers (26 au total, 4 raretés)
| Rareté | Couleur | Exemples |
|---|---|---|
| Commun | 🟢 vert | Briscard, Chanceux, Rentier, Fortune |
| Peu commun | 🔵 bleu | Relanceur, Orfèvre, Doubleur, Marathonien, Raccourci |
| Rare | 🟡 or | Maniaque, Accumulateur, Sextuple, Grand Raccourci, Marchand |
| Légendaire | 🔴 rouge | Le Suprême, L'Éternel |

**Jokers spéciaux :**
- 🎲 **Le Sextuple** — joue avec 6 dés au lieu de 5
- ✂️ **Le Raccourci** — Petite suite valide avec 3 dés consécutifs
- 🔀 **Le Grand Raccourci** — Grande suite valide avec 4 dés consécutifs
- 🏅 **Le Marathonien** — +2 lancers par main
- 💼 **Le Marchand** — Brelan/Carré/Yahtzee rapportent de l'or

**Modificateurs aléatoires** sur les jokers en boutique :
- 👻 Fantôme (3%) — ne prend pas de slot joker
- ✦ Doré (9%) — +50 Chips sur chaque combo
- ⚡ Amplifié (8%) — Mult ×1.25 sur chaque combo
- 🌠 Étoilé (6%) — +20 Chips +1 Mult sur chaque combo

**Limites :** 5 slots jokers normaux · slots fantômes illimités · 2 slots consommables

### Consommables (8 au total)
| Icône | Nom | Coût | Effet |
|---|---|---|---|
| 🎭 | Dé Joker | 3💰 | Remplace un dé sélectionné par la valeur de votre choix |
| 🎁 | Relance Libre | 2💰 | Octroie une relance supplémentaire immédiate |
| 💥 | Double Mise | 5💰 | Double le score de la prochaine combo jouée |
| 🧊 | Gel | 3💰 | Gèle tous les dés actuellement gardés |
| 🔁 | Miroir | 3💰 | Copie la valeur du premier dé gardé sur tous les autres dés libres |
| 🔮 | Oracle | 4💰 | Révèle et sélectionne automatiquement la meilleure combo sur la prochaine main |
| 🤑 | Bonus | 2💰 | Octroie immédiatement +3💰 |
| ⏩ | Accélération | 4💰 | Octroie une main supplémentaire pour ce blind |

### Constellations (boosters)
13 constellations boostent définitivement une combo pour tout le run.
Bonus équilibrés selon la puissance de la combo (As +12/+1 → Yahtzee +75/+4).

**Boîtes Constellation** (apparaissent en boutique à la place des consommables) :
- 📦 Petite (4💰) — 4 choix
- 🎁 Grande (8💰) — 8 choix
- Animation d'ouverture avec éruption d'étoiles

### Boutique
- Apparaît après chaque blind battue
- 3 jokers proposés (sélection pondérée par rareté)
- Consommables **OU** boîtes constellation (jamais les deux)
- Reroll de la boutique : coût croissant ×2 à chaque relance (2💰 → 4💰 → 8💰 → 16💰…), remis à 2💰 à chaque nouvelle boutique

### Système de seed
- Code `#XXXXXXXX` généré aléatoirement ou saisi manuellement au lancement
- Reproductibilité des tirages boutique via PRNG Mulberry32
- Affiché en permanence dans le panneau de jeu

### Audio
Entièrement généré via Web Audio API (aucun fichier externe) :
- Pad ambiant La mineur avec notes mélodiques ponctuelles
- Son de dés réaliste (impacts multiples décalés)
- Ding de validation de combo

### Encyclopédie
Bouton dans la colonne gauche — liste tous les jokers et consommables avec rareté et description.

## Structure

```
index.html   — 6 écrans : titre, intro blind, jeu, boutique, game over, victoire
style.css    — thème sombre, slots visuels, animations, système de rareté
game.js      — toute la logique (~1300 lignes)
```

## Lancer le jeu

Ouvrez `index.html` dans un navigateur. Aucune dépendance, aucun build.

## Commandes Git

```bash
# Cloner le projet
git clone https://github.com/[votre-pseudo]/yahtzee-rogue.git

# Après une modification
git add .
git commit -m "Description de la modification"
git push
```
