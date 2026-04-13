require('dotenv').config();

async function stressTest(providerConfig, n = 10) {
    const latencies = [];
    const errors = [];
    
    const requests = Array(n).fill().map(async () => {
        const startTime = Date.now();
        try {
            const response = await fetch(providerConfig.url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${providerConfig.key}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: providerConfig.model,
                    messages: [{ role: 'user', content: 'Test' }],
                    max_tokens: 5
                })
            });
            
            const latency = Date.now() - startTime;
            latencies.push(latency);
            
            if (!response.ok) {
                errors.push(`HTTP ${response.status}`);
            }
            return response.ok;
        } catch (error) {
            errors.push(error.message);
            return false;
        }
    });
    
    const results = await Promise.allSettled(requests);
    const success = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    const failed = n - success;
    
    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    
    console.log(`${providerConfig.name}: ${success}/${n} ✅ avg ${Math.round(avgLatency)}ms p95 ${p95}ms`);
    if (errors.length > 0) {
        console.log(`Errors: ${[...new Set(errors)].join(', ')}`);
    }
    
    return { success, failed, avgLatency, p95, errors };
}

// Tester différents seuils
async function runStressTests() {
    const providers = [
        {name: 'Mistral', url: 'https://api.mistral.ai/v1/chat/completions', key: process.env.MISTRAL_API_KEY, model: 'mistral-small-latest'},
        {name: 'Groq', url: 'https://api.groq.com/openai/v1/chat/completions', key: process.env.GROQ_API_KEY, model: 'llama-3.3-70b-versatile'},
        {name: 'HuggingFace', url: 'https://router.huggingface.co/v1/chat/completions', key: process.env.HF_API_KEY, model: 'meta-llama/Llama-3.1-8B-Instruct:novita'}
    ];
    
    console.log(`\nStress test: 10 requêtes parallèles`);
    for (const provider of providers) {
        await stressTest(provider, 10);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Pause entre les tests
    }
}

runStressTests();