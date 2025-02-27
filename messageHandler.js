const { exec } = require('child_process');
const http = require('http'); // Node.js built-in HTTP module
const TTGO_TCALL_SERVER = process.env.TTGO_TCALL_SERVER;
const fs = require('fs');
const sentNumbersFile = 'sent_numbers.txt';

function hasNumberBeenNotified(sender) {
  try {
    const data = fs.readFileSync(sentNumbersFile, 'utf8');
    return data.split('\n').includes(sender); // Check if number exists in the file
  } catch (err) {
    return false; // If file doesn't exist, assume number is new
  }
}

function markNumberAsNotified(sender) {
  fs.appendFileSync(sentNumbersFile, sender + '\n'); // Add number to the file
}

function handleIncomingMessage(sender, message, client) {
  // Normalize message to lowercase and trim spaces
  const normalizedMessage = message.toLowerCase().trim();

  // Respond to specific messages
  if (normalizedMessage === 'led on' || normalizedMessage === 'on led') {
    // Send a reply if "led on" or "on led"
    client.sendMessage(sender, 'OK, it\'s on.');
  } else if (normalizedMessage === 'call me') {
    // Call an external API when the message is "call me"
    let formatted_sender = sender.replace('@c.us', '');
    const apiCommand = `curl -X POST ${TTGO_TCALL_SERVER}/data -H "Content-Type: application/json" -d '{"data": "callTo {+${formatted_sender}}"}'`;
    exec(apiCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error calling API: ${error.message}`);
        return;
      }
      console.log(`API call result: ${stdout}`);
    });
    client.sendMessage(sender, 'OK, I\'ll call you soon.');
  } else if (normalizedMessage === 'call hamid') {
    // Call another API for "call hamid"
    const apiCommand = `curl -X POST ${TTGO_TCALL_SERVER} -H "Content-Type: application/json" -d '{"data": "_call"}'`;
    exec(apiCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error calling API: ${error.message}`);
        return;
      }
      console.log(`API call result: ${stdout}`);
    });
    client.sendMessage(sender, 'OK, calling Hamid.');
  } else if (normalizedMessage.startsWith('send message to')) {
    const regex = /send message to (\+\d+), message: (.+)/i;
    const matches = normalizedMessage.match(regex);

    if (matches && matches.length === 3) {
      const recipientNumber = matches[1]; // Extract the recipient phone number
      const messageBody = matches[2];     // Extract the message body

      // Build the API payload
      const postData = JSON.stringify({
        data: `smsTo {${recipientNumber}} [${messageBody}]`
      });

      // Define options for the HTTP request
      const options = {
        hostname: TTGO_TCALL_SERVER.replace('http://', '').split('/')[0],
        port: 80,
        path: '/data',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        }
      };

      // Create the request
      const req = http.request(options, (res) => {
        let responseBody = '';

        res.on('data', (chunk) => {
          responseBody += chunk;
        });

        res.on('end', () => {
          console.log(`API call result: ${responseBody}`);
          client.sendMessage(sender, `Message sent to ${recipientNumber}: "${messageBody}"`);
        });
      });

      req.on('error', (error) => {
        console.error('Error sending message to API:', error);
        client.sendMessage(sender, 'Failed to send the message.');
      });

      // Send the request with the payload
      req.write(postData);
      req.end();
    } else {
      client.sendMessage(sender, 'Invalid message format. Please use "send message to +923XXXXXXXXX, message: Your message here".');
    }
  } else if (normalizedMessage === 'help') {
    // Respond to 'help' with available commands
    client.sendMessage(sender, 'Available commands:\n1. led on / on led\n2. call me\n3. call hamid\n4. send message to +923XXXXXXXXX, message: Your message here\n5. help');
  } else if (normalizedMessage == 'send ready alert') { // This is a custom message from the WhatsApp client
    const timestamp = new Date().toLocaleString(); // Get the current date and time

    const message = `WhatsApp client is ready! ✅\nTime: ${timestamp}`;
    client.sendMessage(sender, message);
  }
  else {
    if (!hasNumberBeenNotified(sender)) {
      const message = 'Unable to auto-reply, Hamid will contact you soon, (btw Hamid\'s contact number is +923354888420)';
      client.sendMessage(sender, message);
      markNumberAsNotified(sender); // Save the number to prevent duplicate messages
    }
  }
}

module.exports = { handleIncomingMessage };
