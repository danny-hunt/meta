# Python Web Server for Cursor Agent Integration

This Python web server receives input from your Next.js app via ngrok and passes it to cursor-agent for processing.

## Features

- ✅ Flask web server with CORS support
- ✅ ngrok integration for public URL access
- ✅ Automatic cursor-agent execution with commit/push instructions
- ✅ Health check and status endpoints
- ✅ Error handling and logging
- ✅ Threaded processing to avoid blocking

## Setup

### 1. Install Dependencies

```bash
# Install Python requirements
pip install -r requirements.txt

# Or use the setup script
python setup_server.py
```

### 2. Install ngrok

```bash
# On macOS with Homebrew
brew install ngrok/ngrok/ngrok

# Or download from https://ngrok.com/download
```

### 3. Get ngrok Auth Token (Optional but Recommended)

1. Go to https://dashboard.ngrok.com/get-started/your-authtoken
2. Sign up for a free account
3. Copy your auth token
4. Set it as an environment variable:

```bash
export NGROK_AUTH_TOKEN=your_token_here
```

## Usage

### 1. Start the Python Server

```bash
python server.py
```

The server will:
- Start Flask on port 5000
- Set up ngrok tunnel automatically
- Display the public ngrok URL
- Show the webhook endpoint URL

### 2. Update Next.js App

The Next.js app has been updated with:
- Webhook URL input field
- Message textarea
- Submit button
- Status messages
- Instructions

### 3. Test the Integration

1. Start your Next.js app: `npm run dev`
2. Start the Python server: `python server.py`
3. Copy the ngrok URL from the server output
4. Paste it in the "Webhook URL" field in your Next.js app
5. Enter a message and submit

## API Endpoints

### POST /webhook
Main endpoint to receive messages from the Next.js app.

**Request:**
```json
{
  "message": "Your request for cursor-agent"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message received and processing started",
  "timestamp": "2024-01-01T12:00:00"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00",
  "ngrok_url": "https://abc123.ngrok.io"
}
```

### GET /status
Get server status and ngrok URL.

**Response:**
```json
{
  "status": "running",
  "ngrok_url": "https://abc123.ngrok.io",
  "timestamp": "2024-01-01T12:00:00"
}
```

## How It Works

1. **Next.js App**: User enters a message and webhook URL, submits the form
2. **Python Server**: Receives the message via POST to `/webhook`
3. **cursor-agent**: Server runs cursor-agent with the message and instructions to commit/push
4. **Git**: cursor-agent commits and pushes changes to main branch
5. **Vercel**: Detects changes and triggers redeployment

## Configuration

### Environment Variables

- `NGROK_AUTH_TOKEN`: Your ngrok authentication token (optional)

### cursor-agent Command

The server runs cursor-agent with this command:
```bash
cursor-agent "Your message here. Please make the necessary changes as specified above. When you're done making changes: 1. Commit the changes with a descriptive commit message 2. Push the changes to the main branch. This will trigger a redeployment on Vercel."
```

You may need to adjust the `cursor-agent` command in `server.py` based on how cursor-agent is installed on your system.

## Troubleshooting

### ngrok Issues
- Make sure ngrok is installed: `ngrok version`
- Check your auth token: `ngrok config check`
- Try running ngrok manually: `ngrok http 5000`

### cursor-agent Issues
- Make sure cursor-agent is installed and accessible from command line
- Check the command in `server.py` matches your cursor-agent installation
- Verify cursor-agent has git permissions to commit and push

### Network Issues
- Check firewall settings
- Ensure port 5000 is available
- Verify CORS is working (check browser console)

## Security Notes

- The server runs on all interfaces (`0.0.0.0`) to work with ngrok
- CORS is enabled for the Next.js app
- No authentication is implemented (add if needed for production)
- ngrok URLs are temporary and change on restart

## Development

To modify the server:

1. Edit `server.py` for server logic
2. Edit `requirements.txt` for dependencies
3. Restart the server: `python server.py`

The server will automatically reload with Flask's debug mode.