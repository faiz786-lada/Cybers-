const BACKEND_URL = "https://cybers-8028.onrender.com";

let isProcessing = false;
let isConnected = false;
let currentChatHistory = [];
let chatSessions = [];
let currentSessionId = null;

// DOM Elements
const messagesContainer = document.getElementById('messagesContainer');
const welcomeContainer = document.getElementById('welcomeContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const typingIndicator = document.getElementById('typingIndicator');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const newChatBtn = document.getElementById('newChatBtn');
const chatHistoryList = document.getElementById('chatHistoryList');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const clearBtn = document.getElementById('clearBtn');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Cyber AI Frontend Starting...');
    console.log('Backend URL:', BACKEND_URL);
    
    // Load saved chats from localStorage
    loadChatSessions();
    
    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    newChatBtn.addEventListener('click', startNewChat);
    clearBtn.addEventListener('click', clearCurrentChat);
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleSidebar);
    }
    
    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
    
    // Example prompts
    document.querySelectorAll('.example-prompt').forEach(prompt => {
        prompt.addEventListener('click', function() {
            const question = this.getAttribute('data-prompt');
            userInput.value = question;
            sendMessage();
        });
    });
    
    // Test connection
    testConnection();
    
    setTimeout(() => {
        userInput.focus();
    }, 500);
});

// Toggle sidebar for mobile
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

// Load chat sessions from localStorage
function loadChatSessions() {
    const saved = localStorage.getItem('cyber_ai_chats');
    if (saved) {
        chatSessions = JSON.parse(saved);
        renderChatHistory();
        
        if (chatSessions.length > 0) {
            currentSessionId = chatSessions[0].id;
            loadChatSession(currentSessionId);
        } else {
            startNewChat();
        }
    } else {
        startNewChat();
    }
}

// Save chat sessions to localStorage
function saveChatSessions() {
    localStorage.setItem('cyber_ai_chats', JSON.stringify(chatSessions));
}

// Render chat history in sidebar
function renderChatHistory() {
    if (!chatHistoryList) return;
    
    chatHistoryList.innerHTML = '';
    
    chatSessions.forEach(session => {
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${currentSessionId === session.id ? 'active' : ''}`;
        historyItem.innerHTML = `
            <i class="fas fa-comment"></i>
            <span>${escapeHtml(session.title || 'New Chat')}</span>
        `;
        historyItem.addEventListener('click', () => {
            currentSessionId = session.id;
            loadChatSession(currentSessionId);
            renderChatHistory();
            if (window.innerWidth <= 1024) {
                document.querySelector('.sidebar').classList.remove('active');
            }
        });
        chatHistoryList.appendChild(historyItem);
    });
}

// Load a specific chat session
function loadChatSession(sessionId) {
    const session = chatSessions.find(s => s.id === sessionId);
    if (!session) return;
    
    currentSessionId = sessionId;
    currentChatHistory = session.messages || [];
    
    // Clear messages container
    while (messagesContainer.firstChild) {
        messagesContainer.removeChild(messagesContainer.firstChild);
    }
    
    // Show welcome container if no messages
    if (currentChatHistory.length === 0) {
        welcomeContainer.style.display = 'block';
    } else {
        welcomeContainer.style.display = 'none';
        currentChatHistory.forEach(msg => {
            renderMessage(msg.text, msg.sender);
        });
    }
}

// Start new chat
function startNewChat() {
    const newSession = {
        id: Date.now().toString(),
        title: 'New Chat',
        messages: [],
        createdAt: new Date().toISOString()
    };
    
    chatSessions.unshift(newSession);
    saveChatSessions();
    
    currentSessionId = newSession.id;
    currentChatHistory = [];
    
    while (messagesContainer.firstChild) {
        messagesContainer.removeChild(messagesContainer.firstChild);
    }
    welcomeContainer.style.display = 'block';
    
    renderChatHistory();
}

// Clear current chat
function clearCurrentChat() {
    if (currentSessionId) {
        const session = chatSessions.find(s => s.id === currentSessionId);
        if (session) {
            session.messages = [];
            session.title = 'New Chat';
            saveChatSessions();
            
            currentChatHistory = [];
            
            while (messagesContainer.firstChild) {
                messagesContainer.removeChild(messagesContainer.firstChild);
            }
            welcomeContainer.style.display = 'block';
            
            renderChatHistory();
        }
    }
}

// Render single message
function renderMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const time = new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const avatarIcon = sender === 'user' ? 'fas fa-user' : 'fas fa-robot';
    
    messageDiv.innerHTML = `
        <div class="avatar ${sender}">
            <i class="${avatarIcon}"></i>
        </div>
        <div class="message-content">
            <div class="message-text">${formatMessage(text)}</div>
            <div class="message-time">${time}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Test backend connection
async function testConnection() {
    console.log('🔄 Testing backend connection...');
    statusText.textContent = 'Connecting...';
    statusDot.style.background = '#f59e0b';
    
    try {
        const response = await fetch(`${BACKEND_URL}/health`, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend connected:', data);
            
            isConnected = true;
            statusDot.style.background = '#10b981';
            statusText.textContent = 'Connected ✓';
            
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
        
    } catch (error) {
        console.error('❌ Connection failed:', error);
        isConnected = false;
        statusDot.style.background = '#ef4444';
        statusText.textContent = 'Disconnected ✗';
    }
}

// Send message function
async function sendMessage() {
    const message = userInput.value.trim();
    
    if (!message) return;
    
    if (!isConnected) {
        addMessage("⚠️ Not connected to backend. Trying to reconnect...", 'ai');
        testConnection();
        return;
    }
    
    if (isProcessing) {
        addMessage("⏳ Please wait, processing previous message...", 'ai');
        return;
    }
    
    if (welcomeContainer && welcomeContainer.style.display !== 'none') {
        welcomeContainer.style.display = 'none';
    }
    
    addMessage(message, 'user');
    userInput.value = '';
    userInput.style.height = 'auto';
    
    typingIndicator.classList.add('active');
    isProcessing = true;
    sendButton.disabled = true;
    statusText.textContent = 'AI thinking...';
    
    try {
        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ message: message })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Response:', data);
        
        typingIndicator.classList.remove('active');
        isProcessing = false;
        sendButton.disabled = false;
        statusText.textContent = 'Connected';
        
        let aiResponse = data.response || data.message || data.content || "I'm Cyber AI. How can I help you?";
        
        addMessage(aiResponse, 'ai');
        
    } catch (error) {
        console.error('❌ Error:', error);
        
        typingIndicator.classList.remove('active');
        isProcessing = false;
        sendButton.disabled = false;
        statusDot.style.background = '#ef4444';
        statusText.textContent = 'Error';
        
        addMessage(
            `⚠️ **Error Processing Request**\n\n` +
            `Message: ${error.message}\n\n` +
            "Please check if the backend server is running at:\n" +
            `${BACKEND_URL}\n\n` +
            "Try these commands to test:\n" +
            "• GET /health\n" +
            "• POST /chat\n" +
            "• GET /identity",
            'ai'
        );
        
        setTimeout(() => testConnection(), 5000);
    }
}

// Add message to UI and save to history
function addMessage(text, sender) {
    renderMessage(text, sender);
    
    if (currentSessionId) {
        const session = chatSessions.find(s => s.id === currentSessionId);
        if (session) {
            session.messages.push({ text, sender, timestamp: new Date().toISOString() });
            
            if (session.messages.length === 1 && sender === 'user') {
                session.title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
            }
            
            saveChatSessions();
            renderChatHistory();
        }
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format message text with markdown support
function formatMessage(text) {
    let formatted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
    
    // Handle tables
    if (formatted.includes('|') && formatted.includes('---')) {
        const lines = formatted.split('<br>');
        let inTable = false;
        let tableHtml = '';
        let newLines = [];
        let headerDone = false;
        
        for (let line of lines) {
            if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                if (!inTable) {
                    inTable = true;
                    tableHtml = '<table class="markdown-table">';
                    headerDone = false;
                }
                
                const cells = line.split('|').filter(cell => cell.trim() !== '');
                
                if (!headerDone && cells.length > 0 && cells[0].includes('---')) {
                    headerDone = true;
                    continue;
                }
                
                let rowHtml = '<tr>';
                for (let cell of cells) {
                    const tag = (!headerDone && tableHtml.includes('<thead>') === false) ? 'th' : 'td';
                    rowHtml += `<${tag}>${cell.trim()}</${tag}>`;
                }
                rowHtml += '</tr>';
                tableHtml += rowHtml;
                
                if (!headerDone && tableHtml.includes('<thead>') === false) {
                    headerDone = true;
                }
            } else {
                if (inTable) {
                    tableHtml += '</table>';
                    newLines.push(tableHtml);
                    inTable = false;
                    tableHtml = '';
                }
                newLines.push(line);
            }
        }
        
        if (inTable) {
            tableHtml += '</table>';
            newLines.push(tableHtml);
        }
        
        formatted = newLines.join('<br>');
    }
    
    return formatted;
}
