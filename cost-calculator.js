require('dotenv').config();

const PRICING = {
    'Mistral Small': 0.20, // € per million tokens
    'Groq Llama 3': 0.05,
    'GPT-4o': 2.50
};

function estimateTokens(text) {
    // Approximation : 1 token ≈ 4 caractères
    return Math.ceil(text.length / 4);
}

function estimateCost(text, label = 'Texte') {
    const tokens = estimateTokens(text);
    
    console.log(`\n${label}: ${text.length} caractères → ~${tokens} tokens\n`);
    console.log('Provider'.padEnd(20) + 'Coût estimé (input)'.padEnd(25) + 'Pour 1000 requêtes');
    console.log('-'.repeat(60));
    
    for (const [provider, pricePerMillion] of Object.entries(PRICING)) {
        const costPerRequest = (tokens / 1_000_000) * pricePerMillion;
        const costPerThousand = costPerRequest * 1000;
        
        console.log(
            provider.padEnd(20) + 
            `${costPerRequest.toFixed(8)}€`.padEnd(25) + 
            `${costPerThousand.toFixed(8)}€`
        );
    }
}

// Test
const testText = "Le développement et les nouvelles technologies, je cherche à approfondir mes compétences en ingénierie logicielle tout en contribuant à des projets innovants, dans un environnement stimulant favorisant l’apprentissage et la collaboration.";
estimateCost(testText, 'Texte de démonstration');

module.exports = { estimateTokens };