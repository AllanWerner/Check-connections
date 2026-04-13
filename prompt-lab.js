require('dotenv').config();

const providers = [
    {
        name: 'Mistral',
        url: 'https://api.mistral.ai/v1/chat/completions',
        key: process.env.MISTRAL_API_KEY,
        format: 'openai',
        model: 'mistral-small-latest'
    },
    {
        name: 'Groq',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        key: process.env.GROQ_API_KEY,
        format: 'openai',
        model: 'llama-3.3-70b-versatile'
    },
    {
        name: 'HuggingFace',
        url: 'https://router.huggingface.co/v1/chat/completions',
        key: process.env.HF_API_KEY,
        format: 'openai',
        model: 'meta-llama/Llama-3.1-8B-Instruct:novita'
    }
];

const temperatures = [0, 0.5, 1];

async function callProvider(provider, prompt, temperature) {
    const startTime = Date.now();
    const actualTemp = temperature === 0 && provider.name === 'HuggingFace' ? 0.01 : temperature;

    try {
        let body;
        
        if (provider.format === 'openai') {
            body = JSON.stringify({
                model: provider.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: actualTemp,
                max_tokens: 100
            });
        } else {
            body = JSON.stringify({
                inputs: prompt,
                parameters: {
                    temperature: actualTemp,
                    max_new_tokens: 100,
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
            return { provider: provider.name, temperature, content: null, error: `HTTP ${response.status}`, latency };
        }
        
        const data = await response.json();
        let content;
        
        if (provider.format === 'openai') {
            content = data.choices[0].message.content;
        } else {
            content = data[0].generated_text;
        }
        
        return { provider: provider.name, temperature, content, latency };
    } catch (error) {
        return { provider: provider.name, temperature, content: null, error: error.message, latency: Date.now() - startTime };
    }
}

async function runPromptLab() {
    const prompt = "Explique ce qu'est un cookie HTTP en une phrase.";
    
    const combinations = providers.flatMap(provider =>
        temperatures.map(temp => ({ provider, temp }))
    );
    
    const results = await Promise.all(
        combinations.map(({ provider, temp }) => callProvider(provider, prompt, temp))
    );
    
    console.log('\n🎮 Prompt Lab - Effet de la température\n');
    results.forEach(result => {
        const status = result.content ? '✅' : '❌';
        console.log(`${status} ${result.provider} | temp ${result.temperature} | ${result.latency}ms`);
        if (result.content) {
            console.log(`   ${result.content.substring(0, 100)}...\n`);
        }
    });
}

runPromptLab();