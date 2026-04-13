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
