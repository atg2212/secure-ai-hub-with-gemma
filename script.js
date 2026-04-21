const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

const API_URL = 'http://localhost:11435/api/chat';
const MODEL_NAME = 'gemma4:31b-it-q8_0';

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Append user message
    appendMessage('user', text);
    logMessage(`User sent: "${text.substring(0, 20)}..."`);
    userInput.value = '';

    // Show typing indicator
    const botMessageDiv = appendMessage('bot', '...');

    try {
        logMessage(`Sending request to model ${MODEL_NAME}...`);
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [
                    {
                        role: 'user',
                        content: text
                    }
                ],
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const reply = data.message.content;
        logMessage(`Response received successfully (${reply.length} chars).`);

        // Update bot message
        botMessageDiv.querySelector('.text').textContent = reply;

    } catch (error) {
        console.error('Error:', error);
        logMessage(`Error: ${error.message}`);
        botMessageDiv.querySelector('.text').textContent = 'Error: Could not connect to the model. Please ensure SSH port forwarding is set up or the API is accessible.';
        botMessageDiv.querySelector('.text').style.color = '#ef4444';
    }

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);

    const avatarDiv = document.createElement('div');
    avatarDiv.classList.add('avatar');
    avatarDiv.textContent = sender === 'bot' ? 'G' : 'U';

    const textDiv = document.createElement('div');
    textDiv.classList.add('text');
    textDiv.textContent = text;

    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(textDiv);
    chatMessages.appendChild(messageDiv);

    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageDiv;
}

function logMessage(message) {
    const logConsole = document.getElementById('log-console');
    if (!logConsole) return;
    const item = document.createElement('div');
    item.classList.add('log-item');
    item.textContent = `> ${new Date().toLocaleTimeString()}: ${message}`;
    logConsole.appendChild(item);
    logConsole.scrollTop = logConsole.scrollHeight;
}

function updateTime() {
    const timeSpan = document.getElementById('current-time');
    if (timeSpan) {
        timeSpan.textContent = new Date().toLocaleTimeString();
    }
}

// Update time every second
setInterval(updateTime, 1000);
updateTime(); // Initial call

// Simple status check
async function checkModelStatus() {
    const statusDot = document.querySelector('.status-indicator');
    try {
        const response = await fetch('http://localhost:11434/');
        if (response.ok) {
            if (statusDot) statusDot.classList.add('connected');
            logMessage('Model connection check: OK');
        } else {
            if (statusDot) statusDot.classList.remove('connected');
            logMessage('Model connection check: Failed');
        }
    } catch (error) {
        if (statusDot) statusDot.classList.remove('connected');
        logMessage('Model connection check: Error connecting');
    }
}

// Check status every 30 seconds
setInterval(checkModelStatus, 30000);
checkModelStatus(); // Initial call
