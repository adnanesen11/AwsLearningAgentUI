Learning Chatbot - AWS Bedrock Agent Integration
A complete chatbot interface that integrates with your AWS Bedrock Agent to answer questions based on training video transcripts stored in your knowledge base.
Features

🤖 AWS Bedrock Agent Integration - Direct connection to your agent (ID: BWLIU13QYP)
📚 Knowledge Base Queries - Access to training video transcripts and timestamps
💬 Real-time Chat Interface - Modern, responsive UI with typing indicators
🔄 Session Management - Maintains conversation context
📱 Mobile Responsive - Works on desktop and mobile devices
🛡️ Error Handling - Comprehensive error handling and user feedback

Architecture
Frontend (HTML/CSS/JS) → Node.js Backend → AWS Bedrock Agent → Knowledge Base (S3)
Prerequisites

Node.js 18+ installed
AWS Account with Bedrock access
AWS CLI configured OR environment variables set
Your AWS Bedrock Agent (BWLIU13QYP) with alias (Learning-poc)

Quick Start
1. Install Dependencies
bashnpm install
2. Configure AWS Credentials
Option A: Using AWS CLI (Recommended)
bashaws configure
Option B: Using Environment Variables
bash# Copy the example environment file
cp .env.example .env

# Edit .env with your AWS credentials
nano .env
3. Project Structure
learning-chatbot/
├── index.html      # Frontend interface
├── script.js       # Frontend JavaScript
├── server.js       # Node.js backend server
├── package.json    # Dependencies
├── .env.example    # Environment template
└── README.md       # This file
4. Start the Application
Development mode:
bashnpm run dev
Production mode:
bashnpm start
5. Access the Application
Open your browser and navigate to: http://localhost:3000
Configuration
Agent Configuration
Your agent details are already configured in the code:

Agent ID: BWLIU13QYP
Alias ID: CAX1BYK1MK (Learning-poc)
Region: us-east-1 (configurable)

Environment Variables
VariableDescriptionDefaultAWS_REGIONAWS region for Bedrockus-east-1AWS_ACCESS_KEY_IDAWS access keyRequiredAWS_SECRET_ACCESS_KEYAWS secret keyRequiredPORTServer port3000NODE_ENVEnvironment modedevelopment
API Endpoints
Health Check
GET /health
Returns server and agent status.
Session Management
POST /api/session
Creates a new chat session.
Chat
POST /api/chat
Sends a message to the AWS Bedrock Agent.
Request Body:
json{
  "message": "What topics are covered in the training videos?",
  "sessionId": "uuid-session-id"
}
Response:
json{
  "response": "Agent response text",
  "sessionId": "uuid-session-id",
  "timestamp": "2025-07-17T22:30:00.000Z"
}
Conversation History
GET /api/conversation/:sessionId
Retrieves conversation history for a session.
AWS Permissions
Your AWS credentials need the following permissions:
json{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeAgent",
        "bedrock:GetAgent",
        "bedrock:GetAgentAlias"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::agent/BWLIU13QYP",
        "arn:aws:bedrock:us-east-1::agent-alias/BWLIU13QYP/*"
      ]
    }
  ]
}
Troubleshooting
Common Issues
Agent Not Found Error

Verify your agent ID and alias ID are correct
Check that the agent is in the same region as your configuration

Access Denied

Ensure your AWS credentials have the correct permissions
Verify the agent is prepared and available

Connection Timeout

Check your internet connection
Verify AWS region is correct

Empty Responses

Ensure your knowledge base is properly configured
Check that training videos are uploaded to S3

Debug Mode
Set NODE_ENV=development to see detailed error messages:
bashexport NODE_ENV=development
npm start
Check Server Status
bashcurl http://localhost:3000/health
Customization
Styling
Modify the CSS in index.html to match your brand colors and design.
Sample Questions
Update the sample questions in index.html to match your training content.
Response Formatting
Modify the formatResponse function in script.js to customize how agent responses are displayed.
Production Deployment
Environment Setup

Set NODE_ENV=production
Use environment variables instead of .env file
Configure proper logging
Set up monitoring and health checks

Scaling Considerations

Use Redis for session storage instead of in-memory
Implement rate limiting
Add authentication/authorization
Use a reverse proxy (nginx)
Deploy on AWS ECS, Lambda, or EC2

Security

Use HTTPS in production
Implement CORS properly
Add authentication
Validate all inputs
Use AWS IAM roles instead of access keys

Sample Interactions
The chatbot can handle questions like:

"What topics are covered in the training videos?"
"Can you summarize the key points from module 1?"
"What are the main safety procedures mentioned?"
"Find information about best practices"
"What happens at timestamp 00:15:30 in video 2?"

Support
For issues related to:

AWS Bedrock: Check AWS documentation and support
Agent Configuration: Verify your agent setup in AWS Console
Application Issues: Check server logs and console errors
