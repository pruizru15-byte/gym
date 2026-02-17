require('dotenv').config();

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces for LAN access

module.exports = {
    PORT,
    HOST
};
