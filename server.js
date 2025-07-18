const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { 
    BedrockAgentRuntimeClient, 
    InvokeAgentCommand 
} = require('@aws-sdk/client-bedrock-agent-runtime');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from public directory

// AWS Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AGENT_ID = 'BWLIU13QYP';
const AGENT_ALIAS_ID = 'CAX1BYK1MK'; // Learning-poc alias

// Initialize Bedrock Agent Runtime Client
const bedrockClient = new BedrockAgentRuntimeClient({
    region: AWS_REGION,
    // AWS credentials will be loaded from environment variables, IAM role, or AWS CLI
});

// In-memory session storage (use Redis or DynamoDB for production)
const sessions = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        agentId: AGENT_ID,
        aliasId: AGENT_ALIAS_ID
    });
});

// Create new session
app.post('/api/session', (req, res) => {
    const sessionId = uuidv4();
    sessions.set(sessionId, {
        id: sessionId,
        createdAt: new Date(),
        messages: []
    });
    
    res.json({ sessionId });
});

// Get session info
app.get('/api/session/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);
    
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
});

// Chat endpoint - invoke AWS Bedrock Agent
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        
        if (!message || !sessionId) {
            return res.status(400).json({ 
                error: 'Message and sessionId are required' 
            });
        }
        
        // Get or create session
        let session = sessions.get(sessionId);
        if (!session) {
            session = {
                id: sessionId,
                createdAt: new Date(),
                messages: []
            };
            sessions.set(sessionId, session);
        }
        
        // Store user message
        session.messages.push({
            type: 'user',
            content: message,
            timestamp: new Date()
        });
        
        // Prepare the invoke agent command
        const command = new InvokeAgentCommand({
            agentId: AGENT_ID,
            agentAliasId: AGENT_ALIAS_ID,
            sessionId: sessionId,
            inputText: message,
            // Optional: Add session attributes or prompt session attributes
            sessionState: {
                sessionAttributes: {},
                promptSessionAttributes: {}
            }
        });
        
        console.log('Invoking AWS Bedrock Agent:', {
            agentId: AGENT_ID,
            agentAliasId: AGENT_ALIAS_ID,
            sessionId: sessionId,
            message: message
        });
        
        // Invoke the agent
        const response = await bedrockClient.send(command);

        console.log('Agent response received:', JSON.stringify(response, null, 2));

        // Process the response
        let agentResponse = '';

        if (response.completion) {
            console.log('Processing streaming response...');
            // Handle streaming response
            for await (const chunk of response.completion) {
                console.log('Chunk received:', chunk);
                if (chunk.chunk && chunk.chunk.bytes) {
                    const decoder = new TextDecoder();
                    const chunkText = decoder.decode(chunk.chunk.bytes);
                    console.log('Decoded chunk text:', chunkText);
                    agentResponse += chunkText;
                }
            }
        } else if (response.output) {
            console.log('Processing direct response...');
            // Handle direct response
            agentResponse = response.output;
        } else {
            console.log('No completion or output found in response');
            // Fallback
            agentResponse = 'I received your message but couldn\'t generate a proper response. Please try again.';
        }

        console.log('Final agent response:', agentResponse);

        
        // Store agent response
        session.messages.push({
            type: 'agent',
            content: agentResponse,
            timestamp: new Date()
        });
        
        res.json({
            response: agentResponse,
            sessionId: sessionId,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error invoking Bedrock Agent:', error);
        
        // Handle different types of errors
        let errorMessage = 'An error occurred while processing your request.';
        
        if (error.name === 'ValidationException') {
            errorMessage = 'Invalid request parameters. Please check your input.';
        } else if (error.name === 'ResourceNotFoundException') {
            errorMessage = 'Agent or alias not found. Please check the configuration.';
        } else if (error.name === 'AccessDeniedException') {
            errorMessage = 'Access denied. Please check your AWS permissions.';
        } else if (error.name === 'ThrottlingException') {
            errorMessage = 'Request throttled. Please try again in a moment.';
        }
        
        res.status(500).json({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get conversation history
app.get('/api/conversation/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);
    
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({
        sessionId: sessionId,
        messages: session.messages,
        createdAt: session.createdAt
    });
});

// Clear conversation
app.delete('/api/conversation/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);
    
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    session.messages = [];
    
    res.json({ message: 'Conversation cleared' });
});

// List all sessions (for debugging)
app.get('/api/sessions', (req, res) => {
    const sessionsList = Array.from(sessions.entries()).map(([id, session]) => ({
        id,
        createdAt: session.createdAt,
        messageCount: session.messages.length
    }));
    
    res.json(sessionsList);
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`Agent ID: ${AGENT_ID}`);
    console.log(`Alias ID: ${AGENT_ALIAS_ID}`);
    console.log(`AWS Region: ${AWS_REGION}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});