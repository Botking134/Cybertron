// commands.js - Cybertron Command Registry
// ⚡ All commands are registered here and dispatched by pair.js

const config = require('./config');
const { normalizeToJid } = require('./stateManager');

const commands = {};

/**
 * Registers a single command into the exports map.
 * @param {Object} cmd - Command object with name and execute function
 */
function register(cmd) {
    if (!cmd.name || typeof cmd.execute !== 'function') return;
    commands[cmd.name] = cmd;
    if (cmd.aliases) {
        cmd.aliases.forEach(alias => {
            commands[alias] = cmd;
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⚡ CYBERTRON CORE COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

// Ping Command
register({
    name: 'ping',
    aliases: ['p'],
    execute: async (sock, msg, args) => {
        const jid = msg.key.remoteJid;
        const start = Date.now();
        const sent = await sock.sendMessage(jid, { text: '🔷 AUTOBOT SIGNAL CHECK...' }, { quoted: msg });
        const latency = Date.now() - start;
        
        await sock.sendMessage(jid, { 
            text: `⚡ *SPARK RESPONSE TIME* ⚡\n\n🔋 *Latency:* ${latency}ms\n🤖 *Status:* OPERATIONAL\n📡 *Signal:* STRONG` 
        }, { quoted: sent });
    }
});

// Help Command
register({
    name: 'help',
    aliases: ['commands', 'h'],
    execute: async (sock, msg, args) => {
        const jid = msg.key.remoteJid;
        const commandList = Object.keys(commands).filter(k => !commands[k].aliases || k === commands[k].name);
        
        const helpText = `
🤖 *CYBERTRON COMMAND SYSTEM* 🤖
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ *Available Commands:*
\n${commandList.slice(0, 10).map(cmd => `\\• \\`${config.prefix}${cmd}\\``).join('\\n')}

📝 *Total Commands:* ${commandList.length}

💬 Prefix: \\`${config.prefix}\\`

*Example:* \\`${config.prefix}ping\\`
        `.trim();
        
        await sock.sendMessage(jid, { text: helpText }, { quoted: msg });
    }
});

// Status Command
register({
    name: 'status',
    aliases: ['stats'],
    execute: async (sock, msg, args) => {
        const jid = msg.key.remoteJid;
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        
        const statusText = `
🤖 *CYBERTRON STATUS REPORT* 🤖
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔷 *Bot Name:* ${config.botName}
👑 *Owner:* ${config.ownerName}

⚡ *System Status:* OPERATIONAL
🔋 *Energon Level:* 100%
⏱️  *Uptime:* ${hours}h ${minutes}m

🎯 *Faction:* AUTOBOT
📡 *Signal:* LOCKED & SECURE
        `.trim();
        
        await sock.sendMessage(jid, { text: statusText }, { quoted: msg });
    }
});

// Info Command
register({
    name: 'info',
    aliases: ['about'],
    execute: async (sock, msg, args) => {
        const jid = msg.key.remoteJid;
        
        const infoText = `
╔═════════════════════════════════════╗
║  🤖 CYBERTRON TRANSFORMER BOT 🤖  ║
╚═════════════════════════════════════╝

⚡ *Version:* 1.0.0
🎯 *Faction:* AUTOBOT
🔐 *Pairing Code:* AUTO-BOTS

📝 *Description:*
A Transformers-themed WhatsApp bot powered by Baileys with epic Cybertron protocols.

🛠️  *Features:*
  • Role-based access control
  • Random Autobot personality
  • Energon-powered operations
  • Spark link communication

💬 *Prefix:* \\`${config.prefix}\\`

📖 *Commands:* Type \\`${config.prefix}help\\`
        `.trim();
        
        await sock.sendMessage(jid, { text: infoText }, { quoted: msg });
    }
});

// Settings Command
register({
    name: 'settings',
    aliases: ['config'],
    execute: async (sock, msg, args, { isOwner, isSudo, isDev }) => {
        const jid = msg.key.remoteJid;
        
        if (!isOwner && !isSudo && !isDev) {
            return await sock.sendMessage(jid, { 
                text: '❌ *Access Denied* - Owner/Sudo/Dev only' 
            }, { quoted: msg });
        }
        
        const settingsText = `
⚙️  *CYBERTRON SETTINGS* ⚙️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 *Bot Config:*
  • Name: ${config.botName}
  • Prefix: ${config.prefix}
  • Mode: ${config.isPublic ? 'PUBLIC' : 'PRIVATE'}

👥 *Permissions:*
  • Owners: ${config.secondaryOwners?.length || 0}
  • Sudos: ${config.sudos?.length || 0}
  • Banned: ${config.banned?.length || 0}

📦 *Pack Info:*
  • Name: ${config.packName}
  • Author: ${config.author}
        `.trim();
        
        await sock.sendMessage(jid, { text: settingsText }, { quoted: msg });
    }
});

// Prefix Command
register({
    name: 'prefix',
    execute: async (sock, msg, args) => {
        const jid = msg.key.remoteJid;
        
        const prefixText = `
🔐 *COMMAND PREFIX* 🔐
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 *Current Prefix:* \\`${config.prefix}\\`

💡 *Usage:* Prefix this symbol before any command.

*Example:*
  \\`${config.prefix}ping\\`
  \\`${config.prefix}help\\`
  \\`${config.prefix}status\\`
        `.trim();
        
        await sock.sendMessage(jid, { text: prefixText }, { quoted: msg });
    }
});

// Owner Command
register({
    name: 'owner',
    execute: async (sock, msg, args) => {
        const jid = msg.key.remoteJid;
        const ownerCard = `
🔷 *BOT OWNER* 🔷
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👑 *Name:* ${config.ownerName}
📱 *Number:* ${config.ownerNumber}

🎯 *Status:* PRIMARY COMMANDER
🔑 *Access:* FULL AUTHORIZATION
        `.trim();
        
        await sock.sendMessage(jid, { text: ownerCard }, { quoted: msg });
    }
});

// Echo Command (Testing)
register({
    name: 'echo',
    execute: async (sock, msg, args) => {
        const jid = msg.key.remoteJid;
        if (!args) {
            return await sock.sendMessage(jid, { text: '❌ No message to echo. Usage: `.echo your message`' }, { quoted: msg });
        }
        await sock.sendMessage(jid, { text: args }, { quoted: msg });
    }
});

// Test Command
register({
    name: 'test',
    execute: async (sock, msg, args) => {
        const jid = msg.key.remoteJid;
        const testText = `
✅ *CYBERTRON ONLINE* ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 Bot is responding correctly!
⚡ All systems operational
🔋 Energon levels optimal

💬 Try: \\`${config.prefix}help\\`
        `.trim();
        
        await sock.sendMessage(jid, { text: testText }, { quoted: msg });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 EXPORT COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = commands;
module.exports.register = register;
