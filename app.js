const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// Assuming port forwarding is set up via IAP:
// gcloud compute start-iap-tunnel gemma-vm 11434 --local-host-port=localhost:11434
const API_URL = 'http://localhost:11434/api/chat';
const MODEL_NAME = 'gemma4:31b-it-q8_0';

function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isUser ? 'user-message' : 'ai-message');

    const avatar = document.createElement('div');
    avatar.classList.add('avatar');
    avatar.textContent = isUser ? 'U' : 'G';

    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    messageContent.textContent = content;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(text, true);
    userInput.value = '';
    
    // Add a loading placeholder for AI response
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('message', 'ai-message');
    loadingDiv.innerHTML = `
        <div class="avatar">G</div>
        <div class="message-content loading">Thinking...</div>
    `;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
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

        chatMessages.removeChild(loadingDiv);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        addMessage(data.message.content);
    } catch (error) {
        chatMessages.removeChild(loadingDiv);
        addMessage(`Error: Failed to connect to model. Make sure you have set up the IAP tunnel to the VM. Details: ${error.message}`);
        console.error(error);
    }
}

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
