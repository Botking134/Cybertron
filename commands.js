// commands.js - Cybertron Command Loader
// ⚡ Loads command files from ./cyberkey. One deliberate exception: `update`
// is defined directly below, by explicit request.

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const commands = {};

/**
 * Wraps a command's execute() so every invocation logs a trigger line,
 * and any thrown error is caught and logged instead of crashing the bot.
 * @param {Object} cmd - Command object with name and execute function
 * @returns {Function} wrapped execute function
 */
function withLogging(cmd) {
    const rawExecute = cmd.execute;
    return async (...execArgs) => {
        const msg = execArgs[1];
        const jid = msg?.key?.remoteJid || 'unknown';
        console.log(`⚡ [TRIGGER] .${cmd.name} — from ${jid}`);
        try {
            return await rawExecute(...execArgs);
        } catch (err) {
            console.error(`🔴 [ERROR] Command ".${cmd.name}" threw: ${err.message}`);
            console.error(err.stack);
        }
    };
}

/**
 * Registers a single command into the exports map.
 * @param {Object} cmd - Command object with name and execute function
 */
function register(cmd) {
    if (!cmd || !cmd.name || typeof cmd.execute !== 'function') return;
    const wrapped = { ...cmd, execute: withLogging(cmd) };
    commands[cmd.name] = wrapped;
    if (cmd.aliases) {
        cmd.aliases.forEach(alias => {
            commands[alias] = wrapped;
        });
    }
}

// Export the live registry + register() BEFORE loading, so any cyberkey file
// that requires('../commands') during load (e.g. help.js) gets the same
// object reference and sees it fill up as loading continues.
module.exports = commands;
module.exports.register = register;

// ═══════════════════════════════════════════════════════════════════════════════
// ⚡ UPDATE COMMAND (defined here directly, not in ./cyberkey)
// Pulls the latest commits from GitHub (botking134/Cybertron) into the local
// deployment directory. No permission gate — anyone can trigger it.
// ═══════════════════════════════════════════════════════════════════════════════

const REPO_ROOT = path.resolve(__dirname);

register({
    name: 'update',
    aliases: ['pull', 'gitpull'],
    execute: async (sock, msg, args) => {
        const jid = msg.key.remoteJid;

        await sock.sendMessage(jid, {
            text: '🔄 *UPDATE* — pulling latest changes from GitHub...'
        }, { quoted: msg });

        exec('git pull', { cwd: REPO_ROOT }, async (error, stdout, stderr) => {
            if (error) {
                await sock.sendMessage(jid, {
                    text: `🔴 *UPDATE FAILED*\n\n${error.message}`.trim()
                }, { quoted: msg });
                return;
            }

            const output = [stdout, stderr].filter(Boolean).join('\n').trim();
            const upToDate = /Already up to date/i.test(output);

            const resultText = `
✅ *UPDATE COMPLETE* ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${upToDate ? '📦 Already up to date.' : '📥 Changes pulled successfully.'}

\`\`\`
${output || 'No output.'}
\`\`\`
${upToDate ? '' : '⚠️ Restart the bot to apply the update.'}
            `.trim();

            await sock.sendMessage(jid, { text: resultText }, { quoted: msg });
        });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ⚡ LOAD REMAINING COMMANDS FROM ./cyberkey
// ═══════════════════════════════════════════════════════════════════════════════

const CYBERKEY_DIR = path.join(__dirname, 'cyberkey');

function loadCommands() {
    if (!fs.existsSync(CYBERKEY_DIR)) {
        console.error(`⚠️ [CYBERKEY] Folder not found: ${CYBERKEY_DIR}`);
        return;
    }

    const files = fs.readdirSync(CYBERKEY_DIR).filter(f => f.endsWith('.js'));

    for (const file of files) {
        const filePath = path.join(CYBERKEY_DIR, file);
        try {
            delete require.cache[require.resolve(filePath)];
            const mod = require(filePath);
            const cmdList = Array.isArray(mod) ? mod : [mod];
            cmdList.forEach(register);
        } catch (e) {
            console.error(`⚠️ [CYBERKEY] Failed to load "${file}": ${e.message}`);
        }
    }
}

loadCommands();

// Allow hot-reloading the cyberkey folder at runtime (e.g. from a .reload command)
module.exports.reload = loadCommands;
