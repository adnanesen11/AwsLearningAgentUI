// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
let conversationHistory = [];
let sessionId = null;
let isProcessing = false;

// Initialize session on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeSession();
    document.getElementById('messageInput').focus();
});

// Initialize a new session
async function initializeSession() {
    try {
        const response = await fetch(`${API_BASE_URL}/session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            sessionId = data.sessionId;
            console.log('Session initialized:', sessionId);
        } else {
            console.error('Failed to initialize session');
        }
    } catch (error) {
        console.error('Error initializing session:', error);
    }
}

// Add message to chat area
function addMessage(content, isUser = false) {
    const chatArea = document.getElementById('chatArea');
    const message = document.createElement('div');
    message.className = `message ${isUser ? 'user' : 'bot'}`;
    
    const timestamp = new Date().toLocaleTimeString();
    
    message.innerHTML = `
        <div class="message-content">
            ${content}
            <div class="timestamp">${timestamp}</div>
        </div>
    `;
    
    chatArea.appendChild(message);
    chatArea.scrollTop = chatArea.scrollHeight;
    
    // Remove sample questions after first interaction
    const sampleQuestions = document.querySelector('.sample-questions');
    const welcomeMessage = document.querySelector('.welcome-message');
    if (sampleQuestions) sampleQuestions.remove();
    if (welcomeMessage) welcomeMessage.remove();
}

// Show typing indicator
function showTypingIndicator() {
    document.getElementById('typingIndicator').style.display = 'block';
    const chatArea = document.getElementById('chatArea');
    chatArea.scrollTop = chatArea.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
    document.getElementById('typingIndicator').style.display = 'none';
}

// Show error message
function showError(message) {
    const chatArea = document.getElementById('chatArea');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = `Error: ${message}`;
    chatArea.appendChild(errorDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

// Send message to AWS Bedrock Agent
async function sendMessage() {
    if (isProcessing) return;
    
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    isProcessing = true;
    document.getElementById('sendButton').disabled = true;
    
    // Add user message
    addMessage(message, true);
    input.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                sessionId: sessionId
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        hideTypingIndicator();
        
        if (data.error) {
            showError(data.error);
        } else {
            // Format the response with proper line breaks and structure
            const formattedResponse = formatResponse(data.response);
            addMessage(formattedResponse, false);
            
            // Store in conversation history
            conversationHistory.push({
                user: message,
                bot: data.response,
                timestamp: new Date(),
                sessionId: sessionId
            });
        }
        
    } catch (error) {
        hideTypingIndicator();
        console.error('Error sending message:', error);
        showError('Failed to connect to the agent. Please try again.');
    } finally {
        isProcessing = false;
        document.getElementById('sendButton').disabled = false;
    }
}

// Format the response from AWS Bedrock Agent
function formatResponse(response) {
    if (!response) return 'No response received.';
    
    // Handle different response formats
    if (typeof response === 'object') {
        // If response has a text property (common in Bedrock responses)
        if (response.text) {
            return formatTextResponse(response.text);
        }
        // If response has content property
        if (response.content) {
            return formatTextResponse(response.content);
        }
        // If response has output property
        if (response.output) {
            return formatTextResponse(response.output);
        }
        // Fallback to JSON stringify
        return `<pre>${JSON.stringify(response, null, 2)}</pre>`;
    }
    
    return formatTextResponse(response);
}

// Format text response with better readability
function formatTextResponse(text) {
    if (!text) return 'No response received.';
    
    // Convert string to HTML with proper formatting
    let formatted = text
        .replace(/\n\n/g, '</p><p>')  // Double line breaks become paragraph breaks
        .replace(/\n/g, '<br>')       // Single line breaks become <br>
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold text
        .replace(/\*(.*?)\*/g, '<em>$1</em>')              // Italic text
        .replace(/`(.*?)`/g, '<code>$1</code>');           // Code text
    
    // Wrap in paragraph tags if not already done
    if (!formatted.includes('<p>')) {
        formatted = `<p>${formatted}</p>`;
    }
    
    return formatted;
}

// Handle sample questions
function askSampleQuestion(question) {
    document.getElementById('messageInput').value = question;
    sendMessage();
}

// Enter key support
document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Clear conversation (optional feature)
function clearConversation() {
    const chatArea = document.getElementById('chatArea');
    chatArea.innerHTML = `
        <div class="welcome-message">
            <p>👋 Welcome! I can help you find information from training videos.</p>
            <p>Ask me anything about the training content stored in the knowledge base!</p>
        </div>
    `;
    conversationHistory = [];
    initializeSession(); // Start a new session
}

// Export conversation (optional feature)
function exportConversation() {
    const data = {
        sessionId: sessionId,
        conversation: conversationHistory,
        exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation_${sessionId}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}