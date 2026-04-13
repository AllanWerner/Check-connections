require('dotenv').config();

function checkEnvVariables() {
    const required = ['MISTRAL_API_KEY', 'GROQ_API_KEY', 'HF_API_KEY'];
    const results = {};
    
    required.forEach(key => {
        results[key] = process.env[key] ? 'présente' : 'manquante';
        console.log(`${key}: ${results[key]}`);
    });
    
    return results;
}

checkEnvVariables();

async function checkProvider(providerConfig) {
    const startTime = Date.now();
    
    try {
        let body;
        let headers = {
            'Content-Type': 'application/json'
        };
        
        // Configuration des headers selon le provider
        if (providerConfig.keyType === 'Bearer') {
            headers['Authorization'] = `Bearer ${providerConfig.key}`;
        } else if (providerConfig.keyType === 'Api-Key') {
            headers['Api-Key'] = providerConfig.key;
        }
        
        // Configuration du body selon le format
        if (providerConfig.format === 'openai') {
            body = JSON.stringify({
                model: providerConfig.model,
                messages: [{ role: 'user', content: 'Dis juste ok' }],
                max_tokens: 5
            });
        } else if (providerConfig.format === 'huggingface') {
            body = JSON.stringify({
                inputs: 'Dis juste ok',
                parameters: {
                    max_new_tokens: 5,
                    return_full_text: false
                }
            });
        }
        
        const response = await fetch(providerConfig.url, {
            method: 'POST',
            headers,
            body
        });
        
        const latency = Date.now() - startTime;
        
        if (!response.ok) {
            return {
                provider: providerConfig.name,
                status: 'ERROR',
                latency,
                error: `HTTP ${response.status}`
            };
        }
        
        return {
            provider: providerConfig.name,
            status: 'OK',
            latency
        };
    } catch (error) {
        return {
            provider: providerConfig.name,
            status: 'ERROR',
            latency: Date.now() - startTime,
            error: error.message
        };
        //console.error(`Erreur lors de la connexion à ${providerConfig.name}:`, error);
    }
}

// Configuration des providers
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

// Lancer tous les checks en parallèle
async function runAllChecks() {
    const results = await Promise.all(providers.map(provider => checkProvider(provider)));
    return results;
}

function displayResults(results) {
    console.log('\n🔍 Vérification des connexions API...\n');
    
    let successCount = 0;
    
    results.forEach(result => {
        const icon = result.status === 'OK' ? '✅' : '❌';
        const latency = result.status === 'OK' ? `${result.latency}ms` : '';
        const error = result.error ? ` - ${result.error}` : '';

        console.log(result);
        
        //console.log(`${icon} ${result.provider.padEnd(12)} ${latency}${error}`);
        
        if (result.status === 'OK') successCount++;
    });
    
    console.log(`\n${successCount}/${results.length} connexions actives`);
    
    if (successCount === results.length) {
        console.log('Tout est vert. Vous êtes prêts pour la suite !');
    }
}

// Fonction principale pour lancer les checks et afficher les résultats
async function main() {
    const results = await runAllChecks();
    displayResults(results);
}

main();