require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js'); // Use LocalAuth for session management
const qrcode = require('qrcode-terminal');
const express = require('express');
const { exec } = require('child_process');
const { handleIncomingMessage } = require('./messageHandler');
const ntfyServer = process.env.NTFY_SERVER_IP;
const fetch = require('node-fetch'); // Ensure fetch is available in Node.js
// const ntfyServer = '192.168.1.238:9999';

const app = express();
const PORT = 3008;

const ignoredNumbers = [
	'ptcl',
	'+status',
];

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

// Listen for incoming messages
client.on('message', async (msg) => {
	let sender = msg.from;
	let formatted_sender = sender.replace('@c.us', '');  // Remove '@c.us' for numbers
	formatted_sender = `+${formatted_sender}`;  // Add the "+" before the number (formatted as +923354888420)
	const messageContent = msg.body;  // The actual message content

	// Log the sender and message content
	console.log(`Message received from ${formatted_sender}: ${messageContent}`);

	// Check if the sender is a broadcast or status message (those typically contain '@broadcast' or '@status')
	if (sender.includes('@broadcast') || sender.includes('@status')) {
		console.log(`Ignoring broadcast or status message from ${formatted_sender}`);
		return;  // Skip processing if it's from a broadcast or status
	}

	// Check if the sender is in the ignored numbers or names array
	if (ignoredNumbers.some(ignored => formatted_sender.includes(ignored))) {
		console.log(`Ignoring message from ${formatted_sender}`);
		return;  // Skip the curl part if the sender is in the ignored list
	}

	handleIncomingMessage(sender, messageContent, client);

	// Trigger curl command to notify your external service (optional)
	const curlCommand = `curl -d "Message from ${formatted_sender}: ${messageContent}" ${ntfyServer}/msg_received`;
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
});

// Function to trigger a curl command
const triggerCurlCommand = (channel, number, message) => {
	const data = `Message to ${number}: ${message}`;
	const curlCommand = `curl -d "${data}" ${ntfyServer}/${channel}`;

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
	const { number, message, externalApiUrl, curlCommand } = req.body;

	if (!number) {
		return res.status(400).json({ error: 'Missing number' });
	}

	let finalMessage = message || '';

	// Fetch data from external API if URL is provided
	if (externalApiUrl) {
		try {
			const response = await fetch(externalApiUrl);
			const data = await response.json();
			finalMessage += `\n\nFetched Data: ${JSON.stringify(data)}`;
		} catch (error) {
			console.error('Error fetching data:', error);
			return res.status(500).json({ error: 'Failed to fetch data' });
		}
	}

	try {
		const chatId = `${number.replace(/\D/g, '')}@c.us`; // Format number properly

		// Verify if the number is registered on WhatsApp
		const isRegistered = await client.isRegisteredUser(chatId);
		if (!isRegistered) {
			return res.status(400).json({ error: 'This number is not registered on WhatsApp.' });
		}

		// Send the message via WhatsApp
		await client.sendMessage(chatId, finalMessage);
		console.log(`Message sent to ${number}: ${finalMessage}`);

		// Execute cURL command if provided
		if (curlCommand) {
			exec(curlCommand, (error, stdout, stderr) => {
				if (error) {
					console.error(`Error executing cURL command: ${error.message}`);
				} else {
					console.log(`cURL Command Output: ${stdout}`);
				}
			});
		}
		triggerCurlCommand('msg_send', number, message);
		return res.status(200).json({ status: 'Message sent successfully!' });
	} catch (error) {
		triggerCurlCommand('msg_failed', number, message);
		console.error('Error sending message via WhatsApp:', error);
		return res.status(500).json({ error: 'Failed to send message' });
	}
});

// Start the Express server
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
