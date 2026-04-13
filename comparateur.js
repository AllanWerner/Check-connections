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

const prompts = {
    traduction: "Traduis cette phrase en anglais: 'Le chat dort sur le canapé'",
    résumé: "Résume ce paragraphe en une phrase: 'Le machine learning est une branche de l'intelligence artificielle qui permet aux systèmes d'apprendre et de s'améliorer à partir de données. Contrairement à la programmation traditionnelle, où on donne des règles explicites, le machine learning utilise des algorithmes pour identifier des motifs et faire des prédictions.'",
    code: "Écris une fonction JavaScript qui inverse une chaîne de caractères. Donne juste le code, sans explication.",
    créatif: "Donne une métaphore originale pour expliquer ce qu'est un LLM (Large Language Model) à un enfant de 10 ans.",
    factuel: "Qui a inventé le Transformer en 2017 ? Donne juste les noms des auteurs."
};

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

async function runComparateur() {
    const tasks = Object.entries(prompts).flatMap(([task, prompt]) =>
        providers.map(provider => ({ task, prompt, provider }))
    );
    
    const results = await Promise.all(
        tasks.map(({ task, prompt, provider }) => 
            callProvider(provider, prompt).then(result => ({ ...result, task }))
        )
    );
    
    // Affichage en tableau markdown
    console.log('\n| Type | Mistral | Groq | HuggingFace |');
    console.log('|------|---------|------|-------------|');
    
    const tasksList = [...new Set(results.map(r => r.task))];
    
    tasksList.forEach(task => {
        const taskResults = results.filter(r => r.task === task);
        const mistral = taskResults.find(r => r.provider === 'Mistral')?.content?.substring(0, 100) || 'N/A';
        const groq = taskResults.find(r => r.provider === 'Groq')?.content?.substring(0, 100) || 'N/A';
        const hf = taskResults.find(r => r.provider === 'HuggingFace')?.content?.substring(0, 100) || 'N/A';
        
        console.log(`| ${task} | ${mistral}... | ${groq}... | ${hf}... |`);
    });
}

runComparateur();