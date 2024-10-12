const { Client, LocalAuth } = require('whatsapp-web.js'); // Use LocalAuth for session management
const qrcode = require('qrcode-terminal');
const express = require('express');
const fs = require('fs');

const app = express();
const PORT = 3008;

// Middleware to parse JSON bodies
app.use(express.json());

// Create a new WhatsApp client instance with LocalAuth
const client = new Client({
    authStrategy: new LocalAuth() // Use LocalAuth for session management
});

// Handle QR code generation
client.on('qr', (qr) => {
    console.log('QR Code generated! Scan it with your phone.');
    qrcode.generate(qr, { small: true });
});

// Log when the client is ready
client.on('ready', () => {
    console.log('WhatsApp client is ready!');
});

// Handle authentication errors
client.on('auth_failure', () => {
    console.error('Authentication failed. Please restart the session.');
});

// Start the WhatsApp client
client.initialize();

// API endpoint to send messages
app.post('/send', async (req, res) => {
    const { number, message } = req.body;

    if (!number || !message) {
        return res.status(400).json({ error: 'Missing number or message' });
    }

    try {
        const chatId = `${number}@c.us`; // Format the chat ID
        await client.sendMessage(chatId, message);
        return res.status(200).json({ status: 'Message sent successfully!' });
    } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).json({ error: 'Failed to send message' });
    }
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
