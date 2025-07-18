#!/bin/bash
# setup.sh - Initial setup script

echo "🚀 Setting up Learning Chatbot - AWS Bedrock Integration"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if AWS CLI is installed
if command -v aws &> /dev/null; then
    echo "✅ AWS CLI is installed"
    AWS_CONFIGURED=$(aws configure list 2>/dev/null | grep -c "access_key")
    if [ "$AWS_CONFIGURED" -gt 0 ]; then
        echo "✅ AWS CLI appears to be configured"
    else
        echo "⚠️  AWS CLI is not configured. Run 'aws configure' or set environment variables."
    fi
else
    echo "⚠️  AWS CLI is not installed. You can still use environment variables."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your AWS credentials."
    echo "   nano .env"
else
    echo "✅ .env file already exists"
fi

# Create logs directory
mkdir -p logs
echo "✅ Created logs directory"

# Create public directory and copy frontend files
mkdir -p public
cp index.html public/
cp script.js public/
echo "✅ Copied frontend files to public directory"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your AWS credentials: nano .env"
echo "2. Start the development server: npm run dev"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "Agent Details:"
echo "- Agent ID: BWLIU13QYP"
echo "- Alias: Learning-poc (CAX1BYK1MK)"
echo "- Region: us-east-1"
echo ""