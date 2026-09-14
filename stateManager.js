// stateManager.js - State Management
const fs = require('fs');
const path = require('path');
const config = require('./config');

const STATE_PATH = path.join(__dirname, 'storage', 'state.json');

global.lidCache = global.lidCache || {};

/**
 * Normalizes any WhatsApp identifier cleanly.
 */
function normalizeToJid(input) {
    if (!input) return '';
    const clean = input.replace(/:[\d]+@/, '@');
    if (clean.endsWith('@s.whatsapp.net')) return clean;
    if (clean.endsWith('@lid')) return clean;
    if (clean.endsWith('@g.us')) return clean;
    if (clean.endsWith('@broadcast') || clean.endsWith('@newsletter')) return clean;
    const raw = clean.split('@')[0].replace(/[^0-9]/g, '');
    return raw ? `${raw}@s.whatsapp.net` : '';
}

/**
 * Safely resolves an LID JID to a phone JID.
 */
async function getPhoneJid(sock, jid, groupJid = null, cachedMetadata = null) {
    if (!jid) return '';
    const cleanJid = normalizeToJid(jid);
    if (!cleanJid) return '';
    if (cleanJid.endsWith('@s.whatsapp.net')) return cleanJid;
    if (global.lidCache[cleanJid]) return global.lidCache[cleanJid];

    if (groupJid) {
        try {
            const metadata = cachedMetadata || await sock.groupMetadata(groupJid);
            const participant = metadata?.participants?.find(p => {
                const pLid = p.lid ? normalizeToJid(p.lid) : '';
                return pLid === cleanJid || normalizeToJid(p.id) === cleanJid;
            });
            if (participant) {
                const resolved = normalizeToJid(participant.id);
                if (resolved && resolved.endsWith('@s.whatsapp.net')) {
                    global.lidCache[cleanJid] = resolved;
                    return resolved;
                }
            }
        } catch (e) { /* ignore */ }
    }

    try {
        const resolved = await sock.findUserId(cleanJid);
        if (resolved && resolved.phoneNumber) {
            const phoneJid = `${resolved.phoneNumber}@s.whatsapp.net`;
            global.lidCache[cleanJid] = phoneJid;
            return phoneJid;
        }
    } catch (e) { /* ignore */ }

    return cleanJid;
}

/**
 * Loads authorization variables from state.json.
 */
function loadState() {
    const storageDir = path.dirname(STATE_PATH);
    if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
    }

    config.ownerLids = config.ownerLids || [];
    config.sudoLids = config.sudoLids || [];
    config.secondaryOwners = config.secondaryOwners || [];
    config.sudos = config.sudos || [];
    config.banned = config.banned || [];
    config.devLids = config.devLids || [];

    if (config.ownerNumber && !config.ownerJid) {
        config.ownerJid = normalizeToJid(config.ownerNumber);
    }

    try {
        if (fs.existsSync(STATE_PATH)) {
            const data = JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
            const stateKeys = ['secondaryOwners', 'sudos', 'banned', 'ownerLid', 'ownerLids', 'devLids', 'sudoLids'];
            
            for (const key of stateKeys) {
                if (data[key] !== undefined) {
                    if (Array.isArray(data[key])) {
                        config[key] = [...new Set([...config[key], ...data[key]])];
                    } else {
                        config[key] = data[key];
                    }
                }
            }
            console.log('✅ [STATE] Loaded permissions from state.json');
        } else {
            fs.writeFileSync(STATE_PATH, JSON.stringify({
                secondaryOwners: [],
                sudos: [],
                banned: [],
                ownerLid: "",
                ownerLids: [],
                devLids: [],
                sudoLids: []
            }, null, 2));
            console.log('📝 [STATE] Created default state.json');
        }
    } catch (err) {
        console.error('❌ [STATE] Failed to load state:', err.message);
    }
}

/**
 * Writes the active configurations out to state.json.
 */
function saveState() {
    try {
        const storageDir = path.dirname(STATE_PATH);
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
        }

        const stateData = {
            secondaryOwners: (config.secondaryOwners || []).map(normalizeToJid).filter(Boolean),
            sudos: (config.sudos || []).map(normalizeToJid).filter(Boolean),
            banned: (config.banned || []).map(normalizeToJid).filter(Boolean),
            ownerLid: config.ownerLid || "",
            ownerLids: config.ownerLids || [],
            devLids: config.devLids || [],
            sudoLids: config.sudoLids || []
        };

        fs.writeFileSync(STATE_PATH, JSON.stringify(stateData, null, 2), 'utf-8');
        return true;
    } catch (err) {
        console.error('❌ [STATE] Failed to save state:', err.message);
        return false;
    }
}

module.exports = {
    loadState,
    saveState,
    normalizeToJid,
    getPhoneJid
};