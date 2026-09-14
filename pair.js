// ⚡ CYBERTRON PAIR.JS - COMPLETE TRANSFORMER PAIRING PROTOCOL ⚡
// "The battle for Cybertron has begun. Autobots, transform and roll out!"

const readline = require('readline');
const { Boom } = require('@hapi/boom');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const { DEV_LIDS, DEV_JIDS, DEV_PHONE_JIDS } = require('./plugins/devs');
const { handleDeletion } = require('./helpers/log');
const { handleIncomingMessage } = require('./helpers/Infinity');
const { normalizeToJid, getPhoneJid, loadState } = require('./stateManager');
const ActivityManager = require('./helpers/ActivityManager');
const { generateMemberCard, buildCaption } = require('./helpers/WelcomeCardManager');

const TRANSFORMERS = {
    AUTOBOTS: {
        OPTIMUS_PRIME: { name: 'Optimus Prime', faction: 'AUTOBOT', quote: 'Freedom is the right of all sentient beings', color: '🔵' },
        BUMBLEBEE: { name: 'Bumblebee', faction: 'AUTOBOT', quote: 'I may not be the strongest, but I will always protect my friends', color: '🟡' },
        IRONHIDE: { name: 'Ironhide', faction: 'AUTOBOT', quote: 'Defending my team is my duty', color: '⚫' },
        RATCHET: { name: 'Ratchet', faction: 'AUTOBOT', quote: 'Rust in peace, old friend', color: '🟢' },
        SIDESWIPE: { name: 'Sideswipe', faction: 'AUTOBOT', quote: 'Lets roll!', color: '🔴' }
    }
};

const CYBERTRONIAN_COLORS = {
    AUTOBOT_BLUE: '\x1b[34m',
    ENERGON_GREEN: '\x1b[32m',
    ALERT_RED: '\x1b[31m',
    WARNING_YELLOW: '\x1b[33m',
    RESET: '\x1b[0m'
};

const USER_ROLES = {
    DEV: 'DEV',
    OWNER_PRIMARY: 'OWNER_PRIMARY',
    OWNER_SECONDARY: 'OWNER_SECONDARY',
    SUDO: 'SUDO',
    STANDARD: 'STANDARD'
};

const CUSTOM_PAIRING_CODE = 'AUTO-BOTS';

console.log(`
${CYBERTRONIAN_COLORS.AUTOBOT_BLUE}╔═══════════════════════════════════════════════════════════════════════════════╗
║                  🤖 CYBERTRON UNIT - PAIRING PROTOCOL 🤖                      ║
║                                                                               ║
║         ⚡ TRANSFORMER ACTIVATION SEQUENCE INITIATED ⚡                       ║
║                                                                               ║
║  "The battle for Cybertron has begun. Autobots, transform and roll out!"     ║
║                                                                               ║
║                  ${CYBERTRONIAN_COLORS.ENERGON_GREEN}⚡ ENERGON CHARGING: Initializing Spark Protocols ⚡${CYBERTRONIAN_COLORS.AUTOBOT_BLUE}                  ║
║                                                                               ║
║                  🔐 PAIRING CODE: ${CUSTOM_PAIRING_CODE}                                      ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝${CYBERTRONIAN_COLORS.RESET}
`);

try { 
    loadState(); 
    console.log(`${CYBERTRONIAN_COLORS.ENERGON_GREEN}🔋 [ENERGON] State core loaded successfully${CYBERTRONIAN_COLORS.RESET}`);
} catch (e) { 
    console.error(`${CYBERTRONIAN_COLORS.ALERT_RED}⚠️ [CRITICAL] Spark chamber malfunction: ${e.message}${CYBERTRONIAN_COLORS.RESET}`); 
}

const SELECTED_AUTOBOT = Object.values(TRANSFORMERS.AUTOBOTS)[Math.floor(Math.random() * Object.values(TRANSFORMERS.AUTOBOTS).length)];
let hasSentBootReport = false;

global.pairingStatus = global.pairingStatus || {
    status: 'initializing',
    qrRaw: null,
    pairingCode: CUSTOM_PAIRING_CODE,
    user: null,
    botName: SELECTED_AUTOBOT.name,
    faction: 'AUTOBOT',
    transformationStatus: 'VEHICLE_MODE',
    energonLevel: 0
};

function isDuplicateEvent(key) {
    if (!global.processedEventsCache) global.processedEventsCache = new Map();
    const cache = global.processedEventsCache;
    const now = Date.now();
    if (cache.has(key)) {
        const timestamp = cache.get(key);
        if (now - timestamp < 300000) return true;
    }
    cache.set(key, now);
    if (cache.size > 2000) {
        const oldestKey = cache.keys().next().value;
        cache.delete(oldestKey);
    }
    return false;
}

function getUserRole(userJid, userLid) {
    const normalizedJid = normalizeToJid(userJid);
    const normalizedLid = normalizeToJid(userLid);
    
    if (normalizedJid === config.ownerJid || normalizedLid === config.ownerLid) {
        return USER_ROLES.OWNER_PRIMARY;
    }
    
    if (DEV_LIDS.includes(normalizedJid) || DEV_LIDS.includes(normalizedLid) ||
        DEV_JIDS.includes(normalizedJid) || DEV_PHONE_JIDS.includes(normalizedJid)) {
        return USER_ROLES.DEV;
    }
    
    if (Array.isArray(config.secondaryOwners) && 
        (config.secondaryOwners.includes(normalizedJid) || config.secondaryOwners.includes(normalizedLid))) {
        return USER_ROLES.OWNER_SECONDARY;
    }
    
    if (Array.isArray(config.sudos) && 
        (config.sudos.includes(normalizedJid) || config.sudos.includes(normalizedLid))) {
        return USER_ROLES.SUDO;
    }
    
    return USER_ROLES.STANDARD;
}

async function fetchMediaBuffer(url) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: controller.signal
        });
        clearTimeout(timeout);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.buffer();
    } catch (error) {
        console.error(`${CYBERTRONIAN_COLORS.ALERT_RED}⚠️ [ENERGON] Extraction failed: ${error.message}${CYBERTRONIAN_COLORS.RESET}`);
        return null;
    }
}

const WELCOME_MESSAGES = {
    [USER_ROLES.OWNER_PRIMARY]: () => `
${CYBERTRONIAN_COLORS.AUTOBOT_BLUE}╔═════════════════════════════════════════════════════════════════╗
║  🔷 WELCOME, COMMANDER OPTIMUS PRIME 🔷                         ║
║                                                                   ║
║  ⚡ PRIMARY AUTOBOT LEADER DETECTED                              ║
║                                                                   ║
║  🎖️  RANK: Supreme Commander                                    ║
║  📡 SPARK SIGNAL: VIP - Highest Priority                        ║
║  🔑 CLEARANCE: ALPHA - All Systems Authorized                   ║
║  ⚙️  STATUS: Full Access Granted                                ║
║                                                                   ║
║  ${SELECTED_AUTOBOT.color} ${SELECTED_AUTOBOT.name.toUpperCase()} stands ready to execute your orders.${CYBERTRONIAN_COLORS.AUTOBOT_BLUE}         ║
║                                                                   ║
║  "As you command, sir. Cybertron awaits your directives."       ║
║                                                                   ║
║  🚀 All systems: OPERATIONAL                                    ║
║  🔋 Energon: 100% - OPTIMAL                                     ║
║  ⚔️  Combat Status: MAXIMUM READINESS                           ║
║  🔐 Pairing Code: ${CUSTOM_PAIRING_CODE}                                      ║
║                                                                   ║
╚═════════════════════════════════════════════════════════════════╝${CYBERTRONIAN_COLORS.RESET}
    `.trim()
};

async function handleQRGeneration(qr) {
    const energonCharge = Math.floor(Math.random() * 50) + 50;
    console.log(`
${CYBERTRONIAN_COLORS.AUTOBOT_BLUE}╔═════════════════════════════════════════════════════════════════════════════╗
║                    🔐 AUTOBOT RECOGNITION PROTOCOL 🔐                      ║
║                                                                             ║
║  ⚡ ${SELECTED_AUTOBOT.color} ${SELECTED_AUTOBOT.name.toUpperCase()} - SPARK LINK INITIALIZATION${CYBERTRONIAN_COLORS.AUTOBOT_BLUE}                ║
║                                                                             ║
║  📡 SCANNING FOR DECEPTICON SIGNAL INTERFERENCE...                         ║
║                                                                             ║
║  🔷 QUANTUM ENCRYPTED QR MATRIX GENERATED                                  ║
║     └─ Hold your mobile device to the scanner                              ║
║                                                                             ║
║  ⏱️  ENERGON CHARGING: ${energonCharge}% ████████░░                                 ║
║                                                                             ║
║  🔐 PAIRING CODE: ${CUSTOM_PAIRING_CODE}                                           ║
║                                                                             ║
╚═════════════════════════════════════════════════════════════════════════════╝
${CYBERTRONIAN_COLORS.RESET}`);
    
    global.pairingStatus.qrRaw = qr;
    global.pairingStatus.transformationStatus = 'SCANNING_MODE';
    global.pairingStatus.energonLevel = energonCharge;
}

async function handleReady(sock) {
    console.log(`
${CYBERTRONIAN_COLORS.AUTOBOT_BLUE}╔═════════════════════════════════════════════════════════════════════════════╗
║              🚀 CYBERTRON UNIT ACTIVATED - TRANSFORMATION COMPLETE 🚀       ║
║                                                                             ║
║  ${SELECTED_AUTOBOT.color}${SELECTED_AUTOBOT.name.toUpperCase()}${CYBERTRONIAN_COLORS.AUTOBOT_BLUE} - AUTOBOT SPARK LINK ESTABLISHED                         ║
║                                                                             ║
║  🔷 STATUS: ${CYBERTRONIAN_COLORS.ENERGON_GREEN}READY FOR COMBAT${CYBERTRONIAN_COLORS.AUTOBOT_BLUE}                                         ║
║  🔋 ENERGON LEVELS: ${CYBERTRONIAN_COLORS.ENERGON_GREEN}100% OPTIMAL${CYBERTRONIAN_COLORS.AUTOBOT_BLUE}                                   ║
║  ⚙️  TRANSFORMER STATUS: ${CYBERTRONIAN_COLORS.ENERGON_GREEN}ROBOT MODE ACTIVE${CYBERTRONIAN_COLORS.AUTOBOT_BLUE}                          ║
║  🎯 FACTION: ${CYBERTRONIAN_COLORS.ENERGON_GREEN}AUTOBOT - DEFENDING HUMANITY${CYBERTRONIAN_COLORS.AUTOBOT_BLUE}                      ║
║  📡 SPARK SIGNAL: ${CYBERTRONIAN_COLORS.ENERGON_GREEN}LOCKED AND SECURE${CYBERTRONIAN_COLORS.AUTOBOT_BLUE}                           ║
║  ⚔️  COMBAT READINESS: ${CYBERTRONIAN_COLORS.ENERGON_GREEN}MAXIMUM${CYBERTRONIAN_COLORS.AUTOBOT_BLUE}                                  ║
║                                                                             ║
║  💬 "${SELECTED_AUTOBOT.quote}"                                           ║
║                                                                             ║
║  ⚡ All systems nominal. Standing by for orders, Commander. ⚡            ║
║                                                                             ║
╚═════════════════════════════════════════════════════════════════════════════╝
${CYBERTRONIAN_COLORS.RESET}`);
    
    global.pairingStatus.status = 'ready';
    global.pairingStatus.transformationStatus = 'ROBOT_MODE';
    global.pairingStatus.energonLevel = 100;
    global.pairingStatus.user = sock.user;
    global.pairingStatus.registered = true;
    
    config.botJid = normalizeToJid(sock.user.id);
    config.botLid = sock.user.lid ? normalizeToJid(sock.user.lid) : config.botJid;
    
    if (!hasSentBootReport) {
        hasSentBootReport = true;
        const ownerJid = config.ownerJid || sock.user.id;
        const ownerLid = config.ownerLid;
        const userRole = getUserRole(ownerJid, ownerLid);
        
        if (userRole === USER_ROLES.OWNER_PRIMARY) {
            const welcomeMessage = WELCOME_MESSAGES[USER_ROLES.OWNER_PRIMARY]();
            try {
                const imageBuffer = await fetchMediaBuffer('https://files.catbox.moe/sxg74y.jpeg');
                if (imageBuffer) {
                    await sock.sendMessage(ownerJid, { image: imageBuffer, caption: welcomeMessage });
                } else {
                    await sock.sendMessage(ownerJid, { text: welcomeMessage });
                }
                console.log(`${CYBERTRONIAN_COLORS.ENERGON_GREEN}✅ [BOOT] Welcome message sent to primary owner${CYBERTRONIAN_COLORS.RESET}`);
            } catch (e) {
                console.error(`${CYBERTRONIAN_COLORS.WARNING_YELLOW}⚠️ [COMMS] Unable to send boot notification: ${e.message}${CYBERTRONIAN_COLORS.RESET}`);
            }
        }
    }
}

async function handleMessages(messages, sock) {
    for (const message of messages) {
        try {
            const eventKey = `${message.key.remoteJid}_${message.key.id}`;
            if (isDuplicateEvent(eventKey)) continue;
            await handleIncomingMessage(message, sock);
        } catch (e) {
            console.error(`${CYBERTRONIAN_COLORS.ALERT_RED}⚠️ [INTELLIGENCE] Message processing error: ${e.message}${CYBERTRONIAN_COLORS.RESET}`);
        }
    }
}

module.exports = async function startPairingSocket(makeSocket) {
    console.log(`${CYBERTRONIAN_COLORS.ENERGON_GREEN}🔥 [FORGE] Initializing Cybertron Spark Chamber...\n${CYBERTRONIAN_COLORS.RESET}`);
    
    const sock = makeSocket({
        auth: { creds: global.auth_creds, keys: global.auth_keys },
        logger: require('pino')({ level: 'fatal' }),
        browser: ['Cybertron', 'Safari', '2.3000.1015']
    });
    
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) await handleQRGeneration(qr);
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason === 401 || reason === 403) {
                console.error(`${CYBERTRONIAN_COLORS.ALERT_RED}🔴 [LOCKOUT] Session invalidated${CYBERTRONIAN_COLORS.RESET}`);
                process.exit(1);
            }
        }
        if (connection === 'open') await handleReady(sock);
    });
    
    sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify') await handleMessages(m.messages, sock);
    });
    
    return sock;
};