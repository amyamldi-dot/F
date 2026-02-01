// netlify/functions/market.js
// Proxy pour la recherche de niches via Claude + web_search
// Même clé ANTHROPIC_API_KEY utilisée

const fetch = require(‘node-fetch’);

exports.handler = async function(event) {
if (event.httpMethod === ‘OPTIONS’) {
return { statusCode: 200, headers: { ‘Access-Control-Allow-Origin’: ‘*’, ‘Access-Control-Allow-Methods’: ‘POST’, ‘Access-Control-Allow-Headers’: ‘Content-Type’ }, body: ‘’ };
}

```
if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
}

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY non configurée' }) };
}

let body;
try {
    body = JSON.parse(event.body);
} catch(e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body JSON invalide' }) };
}

const { prompt, searchContext } = body;
if (!prompt) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Prompt manquant' }) };
}

try {
    // Première requête avec web_search activé pour que Claude cherche en live
    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            tools: [
                {
                    type: 'web_search_20250305',
                    name: 'web_search'
                }
            ],
            messages: [
                {
                    role: 'user',
                    content: `Avant de répondre, fais ces recherches sur le web pour avoir des données récentes :
```

1. Recherche : “${searchContext} prix moyens”
1. Recherche : “${searchContext} tendances 2025”
1. Recherche : “revente ${searchContext} meilleures niches”

Puis analyse les résultats et réponds avec le JSON demandé.\n\n${prompt}`
}
]
})
});

```
    const data = await res.json();

    if (!res.ok) {
        return {
            statusCode: res.status,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: data.error?.message || `Erreur ${res.status}` })
        };
    }

    // Extract the final text response (ignore tool_use blocks)
    const textBlocks = (data.content || []).filter(b => b.type === 'text');
    const result = textBlocks.map(b => b.text).join('');

    // Si Claude a utilisé les outils mais n'a pas encore donné la réponse finale,
    // on relance avec l'historique complet (agentic loop)
    if (data.stop_reason === 'tool_use') {
        // Récupérer les tool_use blocks
        const toolUses = (data.content || []).filter(b => b.type === 'tool_use');
        
        // Simuler les résultats de recherche (dans un vrai setup, on ferait les requêtes)
        // Claude avec web_search_20250305 gère ça automatiquement côté serveur Anthropic
        // On retourne quand même ce qu'on a
        const partialText = textBlocks.map(b => b.text).join('');
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({ result: partialText || 'Recherche en cours — réessaie dans quelques secondes' })
        };
    }

    return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ result })
    };

} catch(e) {
    return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Erreur réseau: ' + e.message })
    };
}
```

};