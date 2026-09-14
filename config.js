// config.js - Cybertron Bot Configuration

const baseConfig = {
    // ================================================================
    // 🔐 USER VARIABLES
    // ================================================================
    
    /** Primary owner's phone number (without +). */
    ownerNumber: "YOUR_PHONE_NUMBER",
    
    /** Primary owner's display name. */
    ownerName: "Commander",
    
    /** Bot's display name. */
    botName: "Cybertron",
    
    // ================================================================
    // ⚙️  DYNAMIC BEHAVIOR
    // ================================================================
    
    /** Command prefix. */
    prefix: ".",
    
    /** Sticker pack name. */
    packName: "⚡ Cybertron",
    
    /** Sticker author. */
    author: "Autobot",
    
    // ================================================================
    // 👑 PERMISSION LISTS
    // ================================================================
    
    /** Secondary owners (added via .addowner). */
    secondaryOwners: [],
    
    /** Sudo users (added via .setsudo). */
    sudos: [],
    
    /** Banned users (added via .ban). */
    banned: [],
    
    // ================================================================
    // 📦 RUNTIME POPULATED (set by pair.js on connection)
    // ================================================================
    
    /** Primary owner's JID (phone-based). */
    ownerJid: "",
    
    /** Primary owner's LID (resolved from phone JID). */
    ownerLid: "",
    
    /** Bot's own JID. */
    botJid: "",
    
    /** Bot's own LID. */
    botLid: "",
    
    /** Developer LIDs. */
    devLids: []
};

module.exports = baseConfig;