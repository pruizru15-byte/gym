const crypto = require('crypto');

/**
 * Generate a unique client code
 * Format: CLI-YYYYMMDD-XXXX where XXXX is a random hex string
 */
const generateClientCode = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `CLI-${date}-${random}`;
};

module.exports = {
    generateClientCode
};
