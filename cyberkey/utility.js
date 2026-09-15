// cyberkey/utility.js - Utility Commands
// First file in the Utility category. Currently home to: ping

const OPTIMUS_QUOTES = [
    'Freedom is the right of all sentient beings.',
    'Autobots, transform and roll out!',
    'One shall stand, one shall fall.',
    'Till all are one.',
    "There's more to them than meets the eye.",
    'A quest is not a quest without honor.',
    'The needs of the many outweigh the needs of the few.',
    'Sometimes the very things we count on... let us down.'
];

function randomQuote() {
    return OPTIMUS_QUOTES[Math.floor(Math.random() * OPTIMUS_QUOTES.length)];
}

function signalRating(ms) {
    if (ms < 150) return '🟢 LIGHTSPEED';
    if (ms < 400) return '🟡 OPTIMAL';
    if (ms < 800) return '🟠 STABLE';
    return '🔴 LAGGING';
}

const FRAMES = [
    '🔷 *SCANNING SPARK FREQUENCY...*\n[▱▱▱▱▱▱▱▱▱▱] 0%',
    '🔷 *CALCULATING ENERGON FLOW...*\n[▰▰▰▱▱▱▱▱▱▱] 30%',
    '🔷 *SYNCING WITH THE ALLSPARK...*\n[▰▰▰▰▰▰▱▱▱▱] 60%',
    '🔷 *TRANSFORMATION SEQUENCE...*\n[▰▰▰▰▰▰▰▰▰▱] 90%'
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    name: 'ping',
    aliases: ['p'],
    execute: async (sock, msg, args) => {
        const jid = msg.key.remoteJid;
        const start = Date.now();

        const sent = await sock.sendMessage(jid, { text: FRAMES[0] }, { quoted: msg });

        for (let i = 1; i < FRAMES.length; i++) {
            await sleep(400);
            try {
                await sock.sendMessage(jid, { text: FRAMES[i], edit: sent.key });
            } catch (e) {
                // Some Baileys builds don't support message edits — animation
                // just won't visibly update, but the flow continues fine.
            }
        }

        await sleep(300);
        const latency = Date.now() - start;

        const resultText = `
⚡ *SPARK RESPONSE TIME* ⚡
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔋 *Latency:* ${latency}ms
📡 *Signal:* ${signalRating(latency)}
🤖 *Status:* OPERATIONAL

💬 _"${randomQuote()}"_
— Optimus Prime
        `.trim();

        try {
            await sock.sendMessage(jid, { text: resultText, edit: sent.key });
        } catch (e) {
            await sock.sendMessage(jid, { text: resultText }, { quoted: msg });
        }
    }
};
