# RESALE PRO — Guide déploiement Netlify

## Structure des fichiers

```
ton-projet/
├── index.html                          ← renomme resale_pro.html en index.html
├── netlify/
│   └── functions/
│       ├── analyze.js                  ← proxy analyse de photos
│       └── market.js                   ← proxy recherche de niches
└── README.md
```

## Étapes

### 1. Créer un compte Netlify

→ https://app.netlify.com/signup (gratuit)

### 2. Créer une clé API Anthropic

→ https://console.anthropic.com

- Clique “API Keys” à gauche
- “Create API Key”
- Copie la clé (commence par `sk-ant-...`)
- garde-la en sécurité, tu la vois qu’une seule fois

### 3. Déployer sur Netlify

- GitHub : pousse tes fichiers dans un repo, puis sur Netlify clique “New site” → “Import project” → choisis ton repo
- Sans GitHub : sur Netlify clique “New site” → “Deploy manually” → glisse le dossier entier

### 4. Mettre la clé API dans les env vars

- Dans ton projet Netlify → “Site configuration” → “Environment variables”
- Clique “Add variable”
- Key : `ANTHROPIC_API_KEY`
- Value : colle ta clé `sk-ant-...`
- Save

### 5. Redéployer

- Si GitHub : pousse un nouveau commit, ça redeploie automatiquement
- Si Manuel : va dans “Deploys” → “Deploy manually” à nouveau

## C’est bon quand

- L’appli s’ouvre sur l’URL Netlify (genre `ton-site.netlify.app`)
- Le bouton “Analyser ces photos” fonctionne (teste avec 2-3 photos)
- Le bouton “Rechercher les niches” retourne des résultats

## Coûts

- Netlify : gratuit (100GB bandwidth, 125k requêtes/mois)
- Anthropic API : ~0.01-0.05€ par analyse de photos, ~0.02-0.08€ par recherche de niches
- En pratique avec une utilisation normale : moins de 5€/mois

## Problèmes communs

|Erreur                            |Solution                                                                    |
|----------------------------------|----------------------------------------------------------------------------|
|“ANTHROPIC_API_KEY non configurée”|Vérifie que la variable est bien dans env vars et que t’as redéployé        |
|“Erreur réseau vers Claude API”   |La clé est peut-être expirée ou invalide — vérifie sur console.anthropic.com|
|Les fonctions retournent 404      |Vérifie que le dossier s’appelle exactement `netlify/functions/`            |
|“node-fetch is not defined”       |Netlify Functions a node-fetch en built-in depuis Node 18, rien à faire     |