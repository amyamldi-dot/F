// netlify/functions/analyze.js
// Proxy pour l’analyse de photos via Claude Vision
// Déploie sur Netlify et met ANTHROPIC_API_KEY dans les env vars

const fetch = require(‘node-fetch’);

exports.handler = async function(event) {
// CORS preflight
if (event.httpMethod === ‘OPTIONS’) {
return { statusCode: 200, headers: { ‘Access-Control-Allow-Origin’: ‘*’, ‘Access-Control-Allow-Methods’: ‘POST’, ‘Access-Control-Allow-Headers’: ‘Content-Type’ }, body: ‘’ };
}

```
if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
}

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY non configurée dans les env vars Netlify' }) };
}

let body;
try {
    body = JSON.parse(event.body);
} catch(e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body JSON invalide' }) };
}

const { images, prompt } = body;

if (!images || images.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Aucune image envoyée' }) };
}
if (!prompt) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Prompt manquant' }) };
}

// Build message content : images + text prompt
const content = [
    ...images.map(img => ({
        type: 'image',
        source: {
            type: 'base64',
            media_type: img.media_type || 'image/jpeg',
            data: img.data
        }
    })),
    { type: 'text', text: prompt }
];

try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            messages: [{ role: 'user', content }]
        })
    });

    const data = await res.json();

    if (res.ok) {
        const text = (data.content || []).map(b => b.text || '').join('');
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: data.content, result: text })
        };
    } else {
        return {
            statusCode: res.status,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: data.error?.message || `Erreur Claude ${res.status}` })
        };
    }
} catch(e) {
    return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Erreur réseau vers Claude API: ' + e.message })
    };
}
```

};