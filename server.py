#!/usr/bin/env python3
"""
Python web server to receive input from Next.js app via ngrok
and pass it to cursor-agent for processing.
"""

import os
import json
import subprocess
import threading
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import pyngrok.ngrok as ngrok

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js app

# Global variable to store ngrok URL
ngrok_url = None

def run_cursor_agent(message):
    """
    Run cursor-agent with the provided message and instructions to commit/push changes.
    """
    try:
        # Create a comprehensive prompt for cursor-agent
        full_prompt = f"""
{message}

Please make the necessary changes as specified above. When you're done making changes:
1. Commit the changes with a descriptive commit message
2. Push the changes to the main branch

This will trigger a redeployment on Vercel.
"""
        
        # Run cursor-agent with the prompt
        # Note: Adjust the command based on how cursor-agent is installed/configured
        result = subprocess.run(
            ['cursor-agent', full_prompt],
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        return {
            'success': result.returncode == 0,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'returncode': result.returncode
        }
        
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'error': 'cursor-agent timed out after 5 minutes',
            'stdout': '',
            'stderr': '',
            'returncode': -1
        }
    except Exception as e:
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
        print(f"Received message: {message}")
        
        # Run cursor-agent in a separate thread to avoid blocking
        def process_message():
            result = run_cursor_agent(message)
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
        tunnel = ngrok.connect(5000)  # Flask default port
        ngrok_url = tunnel.public_url
        
        print(f"ngrok tunnel created: {ngrok_url}")
        print(f"Webhook URL: {ngrok_url}/webhook")
        
        return ngrok_url
        
    except Exception as e:
        print(f"Error setting up ngrok: {e}")
        return None

def cleanup_ngrok():
    """Clean up ngrok tunnel on shutdown."""
    try:
        ngrok.disconnect()
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
        
        app.run(host='0.0.0.0', port=5000, debug=True)
        
    except KeyboardInterrupt:
        print("\nShutting down server...")
    finally:
        cleanup_ngrok()