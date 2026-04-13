require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;

// Réutiliser les fonctions des phases précédentes
const {checkProvider}  = require('./check-Connections');
const { estimateTokens, PRICING } = require('./cost-calculator');

app.get('/check', async (req, res) => {
    const providers = [
    {
        name: 'Mistral',
        url: 'https://api.mistral.ai/v1/chat/completions',
        key: process.env.MISTRAL_API_KEY,
        keyType: 'Bearer',
        format: 'openai',
        model: 'mistral-small-latest'
    },
    {
        name: 'Groq',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        key: process.env.GROQ_API_KEY,
        keyType: 'Bearer',
        format: 'openai',
        model: 'llama-3.3-70b-versatile'
    },  
    {
        name: 'HuggingFace',
        url: 'https://router.huggingface.co/v1/chat/completions',
        key: process.env.HF_API_KEY,
        keyType: 'Bearer',
        format: 'openai',
        model: 'meta-llama/Llama-3.1-8B-Instruct:novita'
    }
    ];
    
    const results = await Promise.all(providers.map(p => checkProvider(p)));
    res.json(results);
});

app.get('/ask', async (req, res) => {
    const { q, provider } = req.query;
    
    if (!q || !provider) {
        return res.status(400).json({ error: 'Missing q or provider parameter' });
    }
    
    const providerConfig = {
        name: provider,
        url: provider === 'mistral' ? 'https://api.mistral.ai/v1/chat/completions' : 
              provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : null,
        key: process.env[`${provider.toUpperCase()}_API_KEY`],
        format: 'openai',
        model: provider === 'mistral' ? 'mistral-tiny' : 'llama3-8b-8192'
    };
    
    if (!providerConfig.url || !providerConfig.key) {
        return res.status(400).json({ error: 'Invalid provider' });
    }
    
    const result = await callProviderDirect(providerConfig, q);
    res.json(result);
});

app.get('/cost', (req, res) => {
    const { text } = req.query;
    
    if (!text) {
        return res.status(400).json({ error: 'Missing text parameter' });
    }
    
    const tokens = estimateTokens(text);
    const costs = [];
    
    for (const [provider, pricePerMillion] of Object.entries(PRICING)) {
        costs.push({
            provider,
            tokens,
            estimatedCost: `${((tokens / 1_000_000) * pricePerMillion).toFixed(8)}€`
        });
    }
    
    res.json(costs);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});