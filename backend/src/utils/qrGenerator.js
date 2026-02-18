const QRCode = require('qrcode');

/**
 * Generate QR code as data URL
 */
async function generateQRCode(text) {
    try {
        const qrDataURL = await QRCode.toDataURL(text, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: 300,
            margin: 2
        });
        return qrDataURL;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    }
}

/**
 * Generate QR code for server access
 */
async function generateServerQR(url) {
    return await generateQRCode(url);
}

/**
 * Generate QR code for client
 */
async function generateClientQR(clientCode) {
    return await generateQRCode(clientCode);
}

module.exports = {
    generateQRCode,
    generateServerQR,
    generateClientQR
};
