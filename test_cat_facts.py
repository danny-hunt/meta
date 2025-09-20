#!/usr/bin/env python3
"""
Test script for cat facts integration using dedalus-labs
"""

import asyncio
from dedalus_labs import AsyncDedalus, DedalusRunner
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_cat_facts():
    """Test the cat facts integration."""
    try:
        client = AsyncDedalus()
        runner = DedalusRunner(client)

        print("Running cat facts integration test...")
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
        
        print("✅ Success!")
        print(f"Cat fact: {result.final_output}")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_cat_facts())
    if success:
        print("\n🎉 Cat facts integration is working!")
    else:
        print("\n💥 Cat facts integration failed!")