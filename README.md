<img width="808" height="510" alt="image" src="https://github.com/user-attachments/assets/67dae871-b0bf-4241-949e-9198e5648636" />

## 📋 Description

Application web de gestion des transports permettant aux collaborateurs de :
- **Organiser et participer à des covoiturages** entre différentes adresses
- **Réserver des véhicules de service** pour des déplacements professionnels
- **Gérer le parc automobile** (pour les administrateurs)

## 🛠️ Technologies

- **Angular** (standalone components, signals)
- **TypeScript**
- **Node.js 20.x**

## 🚀 Installation et démarrage

**Prérequis :** Node.js 20.x et npm

```bash
# Installation des dépendances
npm install

# Lancement en mode développement
npm start
```

L'application sera accessible à : `http://localhost:4200`

## 🏗️ Build

```bash
# Build de production
npm run build

# Les fichiers statiques seront générés dans le dossier dist/
```


**Tests E2E (Cypress) :**
```bash
# Mode interactif
npx cypress open

# Mode headless
npx cypress run
```

📖 Pour plus de détails sur les tests Cypress, consultez le [CYPRESS_README.md](./CYPRESS_README.md)

