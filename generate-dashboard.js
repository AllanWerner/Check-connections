require('dotenv').config();
const fs = require('fs');
const { runAllChecks } = require('./check-Connections');
const { runStressTests } = require('./stress-test');

async function generateDashboard() {
    const results = await runAllChecks();
    const stressResults = await runStressTests();

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>API Connections Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: auto; background: white; padding: 20px; border-radius: 10px; }
            h1 { color: #333; }
            h2 { color: #666; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
            .ok { color: green; font-weight: bold; }
            .error { color: red; font-weight: bold; }
            .warning { color: orange; font-weight: bold; }
            .metric { font-size: 24px; font-weight: bold; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔍 API Connections Dashboard</h1>

            <h2>📡 État des connexions</h2>
            <table>
                <tr>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Latence</th>
                </tr>
                ${results.map(r => `
                <tr>
                    <td>${r.provider}</td>
                    <td class="${r.status === 'OK' ? 'ok' : 'error'}">${r.status}</td>
                    <td>${r.latency || 'N/A'}ms</td>
                </tr>
                `).join('')}
            </table>

            <h2>⚡ Stress Test</h2>
            <div class="metric">Taux de succès: ${stressResults.success}/${stressResults.total}</div>
            <div class="metric">Latence moyenne: ${stressResults.avgLatency}ms</div>
            <div class="metric">P95: ${stressResults.p95}ms</div>

            <h2>💰 Estimation des coûts (1000 tokens)</h2>
            <table>
                <tr>
                    <th>Provider</th>
                    <th>Coût par million tokens</th>
                    <th>Coût pour 1000 tokens</th>
                </tr>
                <tr>
                    <td>Mistral Small</td>
                    <td>0,20€</td>
                    <td>0,00020€</td>
                </tr>
                <tr>
                    <td>Groq Llama 3</td>
                    <td>0,05€</td>
                    <td>0,00005€</td>
                </tr>
                <tr>
                    <td>GPT-4o</td>
                    <td>2,50€</td>
                    <td>0,00250€</td>
                </tr>
            </table>
        </div>
    </body>
    </html>
    `;

    fs.writeFileSync('results.html', html);
    console.log('Dashboard generated: results.html');
}

module.exports = { generateDashboard };