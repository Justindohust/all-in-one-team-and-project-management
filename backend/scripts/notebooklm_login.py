"""
NotebookLM Login Script
Run this once on the server to authenticate with your NotebookLM account.
This will open a browser window for login.
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from notebooklm import NotebookLMClient


async def main():
    print("=" * 60)
    print("NotebookLM Login Script")
    print("=" * 60)
    print()
    print("This script will open a browser window for you to log in")
    print("to your Google/NotebookLM account.")
    print()
    print("After logging in, your credentials will be stored locally.")
    print("The server will use these credentials for processing recordings.")
    print()
    print("Press Ctrl+C to cancel if needed.")
    print()
    input("Press Enter to continue...")
    print()
    
    try:
        print("Opening browser for login...")
        print("(If no browser opens, check if you have a popup blocker)")
        print()
        
        # This will open browser and handle login
        client = await NotebookLMClient.from_storage()
        
        # Test the connection by listing notebooks
        notebooks = await client.notebooks.list()
        
        print()
        print("=" * 60)
        print("Login Successful!")
        print("=" * 60)
        print(f"Found {len(notebooks)} existing notebook(s)")
        print()
        print("You can now close this window.")
        print("The server will use your NotebookLM account for processing.")
        
        await client.close()
        
    except Exception as e:
        print()
        print("=" * 60)
        print("Login Failed!")
        print("=" * 60)
        print(f"Error: {e}")
        print()
        print("Please try again or check your internet connection.")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

