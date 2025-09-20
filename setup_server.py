#!/usr/bin/env python3
"""
Setup script for the Python web server.
This script helps install dependencies and set up the environment.
"""

import subprocess
import sys
import os

def install_requirements():
    """Install Python requirements."""
    print("Installing Python requirements...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        print("✅ Requirements installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing requirements: {e}")
        return False

def check_ngrok():
    """Check if ngrok is installed."""
    try:
        result = subprocess.run(['ngrok', 'version'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ ngrok is installed")
            return True
        else:
            print("❌ ngrok is not installed")
            return False
    except FileNotFoundError:
        print("❌ ngrok is not installed")
        return False

def install_ngrok():
    """Install ngrok."""
    print("Installing ngrok...")
    try:
        # For macOS
        if sys.platform == 'darwin':
            subprocess.check_call(['brew', 'install', 'ngrok/ngrok/ngrok'])
        else:
            print("Please install ngrok manually from https://ngrok.com/download")
            return False
        print("✅ ngrok installed successfully!")
        return True
    except subprocess.CalledProcessError:
        print("❌ Error installing ngrok. Please install manually from https://ngrok.com/download")
        return False

def setup_ngrok_auth():
    """Set up ngrok authentication."""
    auth_token = os.getenv('NGROK_AUTH_TOKEN')
    if auth_token:
        print(f"✅ NGROK_AUTH_TOKEN is set")
        return True
    else:
        print("⚠️  NGROK_AUTH_TOKEN is not set. You can set it with:")
        print("   export NGROK_AUTH_TOKEN=your_token_here")
        print("   Or get a free token from https://dashboard.ngrok.com/get-started/your-authtoken")
        return False

def main():
    """Main setup function."""
    print("🚀 Setting up Python web server...")
    
    # Install Python requirements
    if not install_requirements():
        return False
    
    # Check ngrok
    if not check_ngrok():
        if not install_ngrok():
            print("⚠️  ngrok installation failed. You can still run the server locally.")
    
    # Check ngrok auth
    setup_ngrok_auth()
    
    print("\n🎉 Setup complete!")
    print("\nTo run the server:")
    print("  python server.py")
    print("\nTo get ngrok auth token:")
    print("  1. Go to https://dashboard.ngrok.com/get-started/your-authtoken")
    print("  2. Copy your auth token")
    print("  3. Run: export NGROK_AUTH_TOKEN=your_token_here")
    print("  4. Run: python server.py")
    
    return True

if __name__ == '__main__':
    main()