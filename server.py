#!/usr/bin/env python3
"""
Python web server to receive input from Next.js app via ngrok
and pass it to cursor-agent for processing.
"""

import os
import json
import subprocess
import threading
import queue
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import pyngrok.ngrok as ngrok

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js app
socketio = SocketIO(app, cors_allowed_origins="*")

# Global variable to store ngrok URL
ngrok_url = None

# Global queue for log messages
log_queue = queue.Queue()

def run_cursor_agent(message, submission_type='implement'):
    """
    Run cursor-agent with the provided message and instructions based on submission type.
    Streams output in real-time via WebSocket for 'implement' requests.
    For 'kanban' requests, runs without streaming.
    """
    try:
        # Create a comprehensive prompt for cursor-agent based on submission type
        if submission_type == 'implement':
            full_prompt = f"""
{message}

Please make the necessary changes as specified above. When you're done making changes:
1. Commit the changes with a descriptive commit message
2. Push the changes to the main branch

This will trigger a redeployment on Vercel.
"""
        else:  # submission_type == 'kanban'
            full_prompt = f"""

Here is a request for changes to a webapp:
{message}

Please add this task to the `meta` vibe-kanban project You have the relevant MCP server details to interact with the kanban system. 
The project id is f65047cc-a6fa-4472-b6b4-0e8376e8324d
"""
        
        # Emit start message
        socketio.emit('cursor_agent_start', {
            'message': 'Starting cursor-agent...',
            'timestamp': datetime.now().isoformat()
        })
        
        # Run cursor-agent with different behavior based on submission type
        if submission_type == 'implement':
            # For implement requests, use streaming output
            process = subprocess.Popen(
                ['cursor-agent', full_prompt],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            stdout_lines = []
            
            # Stream output in real-time
            for line in iter(process.stdout.readline, ''):
                if line:
                    stdout_lines.append(line)
                    # Emit each line via WebSocket
                    socketio.emit('cursor_agent_output', {
                        'line': line.rstrip(),
                        'timestamp': datetime.now().isoformat()
                    })
            
            # Wait for process to complete
            returncode = process.wait()
            
        else:  # submission_type == 'kanban'
            # For kanban requests, run without streaming
            result = subprocess.run(
                ['cursor-agent', full_prompt],
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            stdout_lines = [result.stdout] if result.stdout else []
            returncode = result.returncode
            
            # Emit completion message immediately for kanban requests
            socketio.emit('cursor_agent_complete', {
                'success': returncode == 0,
                'returncode': returncode,
                'timestamp': datetime.now().isoformat()
            })
        
        # Emit completion message for implement requests
        if submission_type == 'implement':
            socketio.emit('cursor_agent_complete', {
                'success': returncode == 0,
                'returncode': returncode,
                'timestamp': datetime.now().isoformat()
            })
        
        return {
            'success': returncode == 0,
            'stdout': ''.join(stdout_lines),
            'stderr': '',
            'returncode': returncode
        }
        
    except Exception as e:
        # Emit error message
        socketio.emit('cursor_agent_error', {
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        })
        
        return {
            'success': False,
            'error': str(e),
            'stdout': '',
            'stderr': '',
            'returncode': -1
        }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'ngrok_url': ngrok_url
    })

@app.route('/webhook', methods=['POST'])
def webhook():
    """
    Main webhook endpoint to receive input from Next.js app.
    """
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({
                'success': False,
                'error': 'No message provided'
            }), 400
        
        message = data['message']
        submission_type = data.get('submissionType', 'implement')
        print(f"Received message: {message}")
        print(f"Submission type: {submission_type}")
        
        # Run cursor-agent in a separate thread to avoid blocking
        def process_message():
            result = run_cursor_agent(message, submission_type)
            print(f"cursor-agent result: {result}")
        
        thread = threading.Thread(target=process_message)
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'success': True,
            'message': 'Message received and processing started',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error processing webhook: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/status', methods=['GET'])
def status():
    """Get server status and ngrok URL."""
    return jsonify({
        'status': 'running',
        'ngrok_url': ngrok_url,
        'timestamp': datetime.now().isoformat()
    })

def setup_ngrok():
    """Set up ngrok tunnel."""
    global ngrok_url
    
    try:
        # Set ngrok auth token if provided
        auth_token = os.getenv('NGROK_AUTH_TOKEN')
        if auth_token:
            ngrok.set_auth_token(auth_token)
        
        # Create ngrok tunnel
        tunnel = ngrok.connect(5001)  # Flask default port
        ngrok_url = tunnel.public_url
        
        print(f"ngrok tunnel created: {ngrok_url}")
        print(f"Webhook URL: {ngrok_url}/webhook")
        
        return ngrok_url
        
    except Exception as e:
        print(f"Error setting up ngrok: {e}")
        return None

def cleanup_ngrok(public_url: str):
    """Clean up ngrok tunnel on shutdown."""
    try:
        ngrok.disconnect(public_url)
        print("ngrok tunnel disconnected")
    except Exception as e:
        print(f"Error disconnecting ngrok: {e}")

if __name__ == '__main__':
    # Set up ngrok
    ngrok_url = setup_ngrok()
    
    if not ngrok_url:
        print("Warning: ngrok setup failed. Server will run locally only.")
    
    try:
        # Start Flask app
        print("Starting Python web server...")
        print(f"Local URL: http://localhost:5000")
        if ngrok_url:
            print(f"Public URL: {ngrok_url}")
            print(f"Webhook endpoint: {ngrok_url}/webhook")
        
        socketio.run(app, host='0.0.0.0', port=5001, debug=True, use_reloader=False, allow_unsafe_werkzeug=True)
        
    except KeyboardInterrupt:
        print("\nShutting down server...")
    finally:
        cleanup_ngrok(ngrok_url)