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
import asyncio
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import pyngrok.ngrok as ngrok
from dedalus_labs import AsyncDedalus, DedalusRunner
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js app
socketio = SocketIO(app, cors_allowed_origins="*")

# Global variable to store ngrok URL
ngrok_url = None

# Global queue for log messages
log_queue = queue.Queue()

def run_cursor_agent(message, submission_type='implement', session_id=None):
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
        
        # Emit start message to specific session if provided
        if session_id:
            try:
                socketio.emit('cursor_agent_start', {
                    'message': 'Starting cursor-agent...',
                    'timestamp': datetime.now().isoformat()
                }, room=session_id)
            except Exception as emit_error:
                print(f"Error emitting start message: {emit_error}")
        
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
                    # Emit each line via WebSocket to specific session
                    if session_id:
                        try:
                            socketio.emit('cursor_agent_output', {
                                'line': line.rstrip(),
                                'timestamp': datetime.now().isoformat()
                            }, room=session_id)
                        except Exception as emit_error:
                            print(f"Error emitting output line: {emit_error}")
            
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
            if session_id:
                try:
                    socketio.emit('cursor_agent_complete', {
                        'success': returncode == 0,
                        'returncode': returncode,
                        'timestamp': datetime.now().isoformat()
                    }, room=session_id)
                except Exception as emit_error:
                    print(f"Error emitting completion message: {emit_error}")
        
        # Emit completion message for implement requests
        if submission_type == 'implement' and session_id:
            try:
                socketio.emit('cursor_agent_complete', {
                    'success': returncode == 0,
                    'returncode': returncode,
                    'timestamp': datetime.now().isoformat()
                }, room=session_id)
            except Exception as emit_error:
                print(f"Error emitting completion message: {emit_error}")
        
        return {
            'success': returncode == 0,
            'stdout': ''.join(stdout_lines),
            'stderr': '',
            'returncode': returncode
        }
        
    except Exception as e:
        # Emit error message to specific session
        if session_id:
            try:
                socketio.emit('cursor_agent_error', {
                    'error': str(e),
                    'timestamp': datetime.now().isoformat()
                }, room=session_id)
            except Exception as emit_error:
                print(f"Error emitting error message: {emit_error}")
        
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

# Socket.IO event handlers
@socketio.on('connect')
def handle_connect():
    """Handle client connection."""
    print(f"Client connected: {request.sid}")
    try:
        emit('connected', {'message': 'Connected to server'})
    except Exception as emit_error:
        print(f"Error emitting connected message: {emit_error}")

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    print(f"Client disconnected: {request.sid}")

@socketio.on('start_processing')
def handle_start_processing(data):
    """Handle start processing request from client."""
    try:
        message = data.get('message')
        submission_type = data.get('submissionType', 'implement')
        
        if not message:
            emit('error', {'error': 'No message provided'})
            return
        
        print(f"Received message: {message}")
        print(f"Submission type: {submission_type}")
        
        # Run cursor-agent in a separate thread to avoid blocking
        def process_message():
            result = run_cursor_agent(message, submission_type, request.sid)
            print(f"cursor-agent result: {result}")
        
        thread = threading.Thread(target=process_message)
        thread.daemon = True
        thread.start()
        
        try:
            emit('processing_started', {
                'message': 'Processing started',
                'timestamp': datetime.now().isoformat()
            })
        except Exception as emit_error:
            print(f"Error emitting processing_started: {emit_error}")
        
    except Exception as e:
        print(f"Error processing request: {e}")
        try:
            emit('error', {'error': str(e)})
        except Exception as emit_error:
            print(f"Error emitting error message: {emit_error}")

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
        
        # For webhook requests, we'll run without Socket.IO events
        # since we don't have a session context
        result = run_cursor_agent(message, submission_type, session_id=None)
        print(f"cursor-agent result: {result}")
        
        return jsonify({
            'success': result['success'],
            'message': 'Processing completed',
            'result': result,
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

async def get_cat_fact():
    """Get a cat fact using the dedalus-labs MCP server integration."""
    try:
        client = AsyncDedalus()
        runner = DedalusRunner(client)

        result = await runner.run(
            input="Give me a cat fact, specifically using the mcp server you've been provided",
            model="openai/gpt-4o-mini",
            mcp_servers=[
                "danny/cat-facts", 
            ],
            stream=False,
            verbose=True,
            debug=True,
        )
        
        return {
            'success': True,
            'cat_fact': result.final_output,
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

@app.route('/cat-facts', methods=['GET'])
def cat_facts():
    """Get a cat fact using MCP server integration."""
    try:
        # Run the async function in a new event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(get_cat_fact())
            return jsonify(result)
        finally:
            loop.close()
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

def setup_ngrok():
    """Set up ngrok tunnel."""
    global ngrok_url
    
    try:
        # Set ngrok auth token if provided
        auth_token = os.getenv('NGROK_AUTH_TOKEN')
        if auth_token:
            ngrok.set_auth_token(auth_token)
        
        # Create ngrok tunnel
        tunnel = ngrok.connect(5002)  # Flask default port
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
        print(f"Local URL: http://localhost:5002")
        if ngrok_url:
            print(f"Public URL: {ngrok_url}")
            print(f"Webhook endpoint: {ngrok_url}/webhook")
        
        socketio.run(app, host='0.0.0.0', port=5002, debug=True, use_reloader=False, allow_unsafe_werkzeug=True)
        
    except KeyboardInterrupt:
        print("\nShutting down server...")
    finally:
        cleanup_ngrok(ngrok_url)