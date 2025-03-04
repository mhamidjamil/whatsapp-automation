require('dotenv').config();
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client();

client.on('qr', (qr) => {
    // Generate and display the QR code in the terminal
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
    // Send a message to a specific number
    const number = '1234567890'; // Include country code
    const message = 'Hello from WhatsApp automation!';
    client.sendMessage(`${number}@c.us`, message);
});

client.initialize();
