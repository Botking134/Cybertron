// Ensure it's 8 uppercase alphanumeric characters (no dashes)
const CUSTOM_PAIRING_CODE = 'AUTOBOTS';

module.exports = async function startPairingSocket(makeSocket) {
    console.log(`${CYBERTRONIAN_COLORS.ENERGON_GREEN}🔥 [FORGE] Initializing Cybertron Spark Chamber...\n${CYBERTRONIAN_COLORS.RESET}`);
    
    const sock = makeSocket({
        auth: { creds: global.auth_creds, keys: global.auth_keys },
        logger: require('pino')({ level: 'fatal' }),
        browser: ['Cybertron', 'Safari', '2.3000.1015']
    });

    // ⚡ REQUEST CUSTOM PAIRING CODE
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const phoneNumber = config.ownerNumber.replace(/[^0-9]/g, '');
                
                // Pass custom code as the second argument:
                const code = await sock.requestPairingCode(phoneNumber, CUSTOM_PAIRING_CODE);
                
                const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;
                global.pairingStatus.pairingCode = formattedCode;
                
                console.log(`
${CYBERTRONIAN_COLORS.AUTOBOT_BLUE}╔═════════════════════════════════════════════════════════════════════════════╗
║                    🔐 AUTOBOT RECOGNITION PROTOCOL 🔐                      ║
║                                                                             ║
║  ⚡ PHONE: +${phoneNumber}                                                  
║  🔐 PAIRING CODE: ${CYBERTRONIAN_COLORS.ENERGON_GREEN}${formattedCode}${CYBERTRONIAN_COLORS.AUTOBOT_BLUE}                                           ║
║                                                                             ║
║  └─ Enter this code in WhatsApp > Linked Devices > Link with phone number    ║
╚═════════════════════════════════════════════════════════════════════════════╝
${CYBERTRONIAN_COLORS.RESET}`);
            } catch (err) {
                console.error(`${CYBERTRONIAN_COLORS.ALERT_RED}⚠️ [ERROR] Failed to request pairing code: ${err.message}${CYBERTRONIAN_COLORS.RESET}`);
            }
        }, 3000);
    }
    
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
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