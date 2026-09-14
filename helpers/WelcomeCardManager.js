// helpers/WelcomeCardManager.js - Welcome Card Management

function generateMemberCard(member) {
    return `Welcome ${member.name}!`;
}

function buildCaption(data) {
    return data.toString();
}

module.exports = {
    generateMemberCard,
    buildCaption
};