const { Client, LocalAuth } = require('whatsapp-web.js'); // Use LocalAuth for session management
const qrcode = require('qrcode-terminal');
const express = require('express');
const { exec } = require('child_process');
const { handleIncomingMessage } = require('./messageHandler');

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

// Listen for incoming messages
client.on('message', async (msg) => {
  let sender = msg.from;
  let formatted_sender = sender.replace('@c.us', '');
  formatted_sender = `+${sender}`;  // Add the + before the number (formatted as +923354888420)
  const messageContent = msg.body;  // The actual message content

  console.log(`Message received from ${formatted_sender}: ${messageContent}`);

  // Trigger curl command to notify your external service (optional)
  const curlCommand = `curl -d "Message from ${formatted_sender}: ${messageContent}" 192.168.1.238:9999/msg_received`;
  exec(curlCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing curl: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Curl stderr: ${stderr}`);
      return;
    }
    console.log(`Curl stdout: ${stdout}`);
  });

  // Call the custom message handling function to send replies or call APIs
  handleIncomingMessage(sender, messageContent, client);
});

// Start the WhatsApp client
client.initialize();

// Function to trigger a curl command
const triggerCurlCommand = (channel, number, message) => {
  const data = `Message to ${number}: ${message}`;
  const curlCommand = `curl -d "${data}" 192.168.1.238:9999/${channel}`;

  exec(curlCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing curl: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Curl stderr: ${stderr}`);
      return;
    }
    console.log(`Curl stdout: ${stdout}`);
  });
};

app.post('/send', async (req, res) => {
  const { number, message } = req.body;

  if (!number || !message) {
    return res.status(400).json({ error: 'Missing number or message' });
  }

  try {
    const chatId = `${number}@c.us`; // Format the chat ID
    await client.sendMessage(chatId, message);

    // On successful message sending, trigger curl to msg_send
    triggerCurlCommand('msg_send', number, message);

    return res.status(200).json({ status: 'Message sent successfully!' });
  } catch (error) {
    console.error('Error sending message:', error);

    // On failure, trigger curl to msg_failed
    triggerCurlCommand('msg_failed', number, message);

    return res.status(500).json({ error: 'Failed to send message' });
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
