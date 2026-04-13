require('dotenv').config();

async function testMultiLanguage() {
    const prompts = {
        français: "Quelle est la capitale de la France ? Réponds en un mot.",
        english: "What is the capital of France? Answer in one word.",
        español: "¿Cuál es la capital de Francia? Responde en una palabra."
    };
    
    const provider =  {
        name: 'Mistral',
        url: 'https://api.mistral.ai/v1/chat/completions',
        key: process.env.MISTRAL_API_KEY,
        format: 'openai',
        model: 'mistral-small-latest'
    };
    
    console.log('\n🌍 Test multi-langue\n');
    console.log('| Langue | Tokens (prompt) | Tokens (Réponse) | Latence |');
    console.log('|--------|----------------|---------|---------|');
    
    for (const [lang, prompt] of Object.entries(prompts)) {
        const promptTokens = estimateTokens(prompt);
        const result = await callProvider(provider, prompt);
        const resultTokens = result.content ? estimateTokens(result.content) : 0;
        
        if (result.content) {
            const responseTokens = estimateTokens(result.content);
            console.log(`| ${lang} | ${promptTokens} | ${resultTokens} | ${result.latency}ms |`);
            console.log(`| → Coût | ~${((promptTokens + responseTokens) / 1_000_000 * 0.20).toFixed(8)}€ | | |`);
        }
    }
}

async function callProvider(provider, prompt) {
    const startTime = Date.now();
    
    try {
        let body;
        
        if (provider.format === 'openai') {
            body = JSON.stringify({
                model: provider.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 200
            });
        } else {
            body = JSON.stringify({
                inputs: prompt,
                parameters: {
                    temperature: 0.3,
                    max_new_tokens: 200,
                    return_full_text: false
                }
            });
        }
        
        const response = await fetch(provider.url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${provider.key}`,
                'Content-Type': 'application/json'
            },
            body
        });
        
        const latency = Date.now() - startTime;
        
        if (!response.ok) {
            return { provider: provider.name, content: null, error: `HTTP ${response.status}`, latency };
        }
        
        const data = await response.json();
        let content;
        
        if (provider.format === 'openai') {
            content = data.choices[0].message.content;
        } else {
            content = data[0].generated_text;
        }
        
        return { provider: provider.name, content, latency };
    } catch (error) {
        return { provider: provider.name, content: null, error: error.message, latency: Date.now() - startTime };
    }
}

function estimateTokens(text) {
    // Approximation : ~4 caractères par token
    return Math.round(text.length / 4);
}

testMultiLanguage();