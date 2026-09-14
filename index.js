// index.js - Cybertron Bot Entry Point
const fs = require('fs');
const path = require('path');
const os = require('os');

const localTempPath = path.join(__dirname, './storage/temp');
try {
    if (!fs.existsSync(localTempPath)) {
        fs.mkdirSync(localTempPath, { recursive: true });
    }
    os.tmpdir = () => localTempPath;
} catch (e) {
    console.error("Failed to redirect temporary directory path:", e);
}

const config = require('./config');
const { loadState } = require('./stateManager');
const { DEV_LIDS } = require('./plugins/devs');
const startPairingSocket = require('./pair');

// Load persistent state
loadState();

console.clear();
console.log(`
========================================`);
console.log(`⚡ INITIALIZING CYBERTRON...`);
console.log(`🤖 Bot Name: ${config.botName}`);
console.log(`👑 Owner: ${config.ownerName}`);
console.log(`🛡️ Devs: ${DEV_LIDS.length} hardcoded`);
console.log(`========================================
`);

// Placeholder for starting the bot
console.log('Ready to connect to WhatsApp...');