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

const { execSync } = require('child_process');

const config = require('./config');
const { loadState } = require('./stateManager');
const startPairingSocket = require('./pair');

// ═══════════════════════════════════════════════════════════════════════════════
// ⚡ REPO SETUP — ensures this deployment is tied to GitHub.com/botking134/Cybertron
// so the .update command's `git pull` works. Runs once at startup; skipped if a
// .git folder already exists (e.g. host already deployed via git clone).
// ═══════════════════════════════════════════════════════════════════════════════

const REPO_URL = 'https://github.com/botking134/Cybertron.git';
const REPO_ROOT = __dirname;

function ensureRepoSetup() {
    const gitDir = path.join(REPO_ROOT, '.git');
    try {
        if (fs.existsSync(gitDir)) {
            console.log('✅ [SETUP] Git repo already present — skipping setup');
            return;
        }

        console.log('⚡ [SETUP] No git repo found — connecting to GitHub...');
        execSync('git init', { cwd: REPO_ROOT, stdio: 'inherit' });
        execSync(`git remote add origin ${REPO_URL}`, { cwd: REPO_ROOT, stdio: 'inherit' });
        execSync('git fetch origin', { cwd: REPO_ROOT, stdio: 'inherit' });
        execSync('git checkout -f main', { cwd: REPO_ROOT, stdio: 'inherit' });
        console.log('✅ [SETUP] Repo initialized and synced with origin/main');
    } catch (e) {
        console.error(`🔴 [SETUP] Repo setup failed: ${e.message}`);
    }
}

ensureRepoSetup();

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