// helpers/ActivityManager.js - Activity Management

class ActivityManager {
    constructor() {
        this.activities = new Map();
    }
    
    log(activity) {
        console.log('[ACTIVITY]', activity);
    }
}

module.exports = ActivityManager;