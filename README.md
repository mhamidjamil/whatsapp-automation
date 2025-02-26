# WhatsApp Bot with API and cURL Execution

## Overview
This project is a **WhatsApp automation bot** that allows you to send messages via WhatsApp Web using `whatsapp-web.js` and Puppeteer. It also supports:
- Fetching data from an external API before sending messages.
- Executing a cURL command after sending a message.

## Features
✅ Send messages to WhatsApp numbers.
✅ Validate if a number is registered on WhatsApp.
✅ Fetch additional data from an external API and append it to the message.
✅ Execute a cURL command after sending a message.
✅ Logs errors and execution status.

---

## Installation
### 1️⃣ Clone the Repository
```sh
git clone https://github.com/mhamidjamil/whatsapp-automation
cd whatsapp-bot
```

### 2️⃣ Install Dependencies
```sh
npm install
```

### 3️⃣ Run the Server
```sh
npm start
```
This will start the server on `http://localhost:3008`.

### 4️⃣ Scan the QR Code
- When you run the server for the first time, a QR code will appear in the console.
- Scan it using **WhatsApp Web** on your phone.
- Once scanned, the bot will be **ready to send messages**.

---

## API Usage
### 📌 Endpoint: `/send`
**Method:** `POST`

#### 📥 Request Body:
```json
{
  "number": "+923354888420",
  "message": "Hello from WhatsApp Bot!",
  "externalApiUrl": "https://jsonplaceholder.typicode.com/todos/1",
  "curlCommand": "curl -X GET http://example.com/api"
}
```

#### 📤 Response:
```json
{
  "status": "Message sent successfully!"
}
```

#### 🔹 How It Works:
1. **Formats the phone number** to WhatsApp format.
2. **Checks if the number is registered** on WhatsApp.
3. **Fetches additional data** from the given `externalApiUrl` and appends it to the message.
4. **Sends the message** via WhatsApp Web.
5. **Executes the provided cURL command** if available.

---

## Troubleshooting
### ❌ Common Errors & Fixes
| Error | Solution |
|-------|----------|
| `wid error: invalid wid` | Ensure the phone number is registered on WhatsApp. |
| `Error sending message` | Restart the server and rescan the QR code. |
| `Error executing cURL` | Check if the cURL command syntax is correct. |

---

## License
This project is licensed under the MIT License.

---

## Author
Developed by **Your Name**. 🚀 Feel free to contribute and enhance the bot!

---

## Contributing
- Fork the repository.
- Create a feature branch.
- Open a pull request!

---

Enjoy automating WhatsApp messages! 📩🔥

