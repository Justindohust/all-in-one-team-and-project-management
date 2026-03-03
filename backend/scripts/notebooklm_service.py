"""
NotebookLM Service - Uses browser-based authentication with user's NotebookLM account
No Gemini API key required - uses the user's existing NotebookLM account
"""

import asyncio
import sys
import os
import json
import tempfile
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from notebooklm import NotebookLMClient


class NotebookLMService:
    def __init__(self):
        self.client = None
        self.notebook_id = None
    
    async def initialize(self):
        """Initialize the NotebookLM client with stored credentials"""
        try:
            self.client = await NotebookLMClient.from_storage()
            print("[NotebookLM] Client initialized successfully")
            return True
        except Exception as e:
            print(f"[NotebookLM] Failed to initialize client: {e}")
            return False
    
    async def process_audio(self, audio_path, meeting_title="Meeting Recording"):
        """
        Process audio file through NotebookLM:
        1. Create a new notebook
        2. Upload audio as source
        3. Generate summary
        4. Return results
        """
        if not self.client:
            await self.initialize()
        
        try:
            # Step 1: Create notebook
            print(f"[NotebookLM] Creating notebook: {meeting_title}")
            notebook = await self.client.notebooks.create(meeting_title)
            self.notebook_id = notebook.id
            print(f"[NotebookLM] Notebook created: {self.notebook_id}")
            
            # Step 2: Upload audio file as source
            print(f"[NotebookLM] Uploading audio file: {audio_path}")
            source = await self.client.sources.add_file(
                self.notebook_id, 
                audio_path, 
                wait=True
            )
            print(f"[NotebookLM] Source added: {source.id if hasattr(source, 'id') else 'unknown'}")
            
            # Step 3: Generate Audio Overview (podcast)
            print("[NotebookLM] Generating Audio Overview...")
            status = await self.client.artifacts.generate_audio(
                self.notebook_id,
                instructions="Create a concise summary of this meeting in podcast format"
            )
            
            # Wait for generation to complete
            await self.client.artifacts.wait_for_completion(
                self.notebook_id, 
                status.task_id
            )
            print("[NotebookLM] Audio generation completed")
            
            # Step 4: Download the audio
            output_dir = os.path.join(os.path.dirname(audio_path), 'processed')
            os.makedirs(output_dir, exist_ok=True)
            
            audio_output = os.path.join(output_dir, 'overview.mp3')
            await self.client.artifacts.download_audio(self.notebook_id, audio_output)
            print(f"[NotebookLM] Audio downloaded: {audio_output}")
            
            # Step 5: Get transcript/summary from chat
            print("[NotebookLM] Getting summary from chat...")
            chat_result = await self.client.chat.ask(
                self.notebook_id,
                "Provide a detailed summary of this meeting including: 1) Main topics discussed, 2) Key decisions made, 3) Action items mentioned"
            )
            
            summary = chat_result.answer if chat_result else "Summary not available"
            
            # Step 6: Generate additional artifacts
            # Generate quiz
            quiz_result = await self.client.artifacts.generate_quiz(self.notebook_id)
            await self.client.artifacts.wait_for_completion(self.notebook_id, quiz_result.task_id)
            
            quiz_path = os.path.join(output_dir, 'quiz.json')
            await self.client.artifacts.download_quiz(
                self.notebook_id, 
                quiz_path, 
                output_format="json"
            )
            
            return {
                'success': True,
                'summary': summary,
                'audioFile': audio_output,
                'quizFile': quiz_path,
                'notebookId': self.notebook_id
            }
            
        except Exception as e:
            print(f"[NotebookLM] Error processing audio: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def cleanup(self):
        """Clean up resources"""
        if self.client:
            await self.client.close()
            print("[NotebookLM] Client closed")


async def process_meeting_recording(audio_path, meeting_title="Meeting Recording"):
    """Main function to process a meeting recording"""
    service = NotebookLMService()
    
    try:
        # Initialize client
        if not await service.initialize():
            return {
                'success': False,
                'error': 'Failed to initialize NotebookLM client. Please run "notebooklm login" first.'
            }
        
        # Process audio
        result = await service.process_audio(audio_path, meeting_title)
        return result
        
    finally:
        await service.cleanup()


if __name__ == "__main__":
    # Command line interface
    if len(sys.argv) < 2:
        print("Usage: python notebooklm_service.py <audio_file_path> [meeting_title]")
        sys.exit(1)
    
    audio_file = sys.argv[1]
    title = sys.argv[2] if len(sys.argv) > 2 else "Meeting Recording"
    
    if not os.path.exists(audio_file):
        print(f"Error: Audio file not found: {audio_file}")
        sys.exit(1)
    
    result = asyncio.run(process_meeting_recording(audio_file, title))
    print(json.dumps(result, indent=2))

