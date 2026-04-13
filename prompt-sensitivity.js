require('dotenv').config();

async function testPromptSensitivity() {
    const variations = [
        "Explique le machine learning",
        "Explique-moi le machine learning",
        "Peux-tu m'expliquer le machine learning ?",
        "C'est quoi le machine learning ?",
        "Machine learning : définition et explication"
    ];
    
    const provider = {
        name: 'Mistral',
        url: 'https://api.mistral.ai/v1/chat/completions',
        key: process.env.MISTRAL_API_KEY,
        format: 'openai',
        model: 'mistral-small-latest'
    };
    
    console.log('\nSensibilité du prompt (Mistral, temperature 0.3) :\n');
    console.log('| Formulation | Tokens | Longueur | Première phrase |');
    console.log('|-------------|--------|----------|------------------|');
    
    for (const variation of variations) {

        try {
            const result = await callProvider(provider, variation);
            if (result.content) {
                const tokens = estimateTokens(result.content);
                const firstSentence = result.content.split('.')[0].substring(0, 50);
                console.log(`| "${variation.substring(0, 30)}..." | ${tokens} | ${result.content.length} cars | "${firstSentence}..." |`);
            }
        } catch (e) {
        console.error('Erreur:', e.message); // Tu verras "estimateTokens is not defined"
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

testPromptSensitivity();