import os
import io
import asyncio
import re
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import mimetypes
import chardet

from bs4 import BeautifulSoup
import requests
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled

from utils.logger import logger
from services.supabase import DBConnection
from knowledge_base.file_processor import FileProcessor # Reusing for knowledge base insertion

class ContentProcessor:
    MAX_CONTENT_LENGTH = 100000

    def __init__(self):
        self.db = DBConnection()
        self.file_processor = FileProcessor() # Reusing its knowledge base insertion logic

    async def process_url_upload(
        self,
        agent_id: str,
        account_id: str,
        url: str,
        source_type: str = "url",
        source_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        try:
            content = ""
            extracted_source_type = ""
            extracted_source_metadata = {}

            if "youtube.com/watch" in url or "youtu.be/" in url:
                content = await self._extract_youtube_transcript(url)
                extracted_source_type = "youtube_transcript"
                extracted_source_metadata = {"url": url, "video_id": self._get_youtube_video_id(url)}
            else:
                content = await self._extract_web_content(url)
                extracted_source_type = "web_page"
                extracted_source_metadata = {"url": url}

            if not content or not content.strip():
                raise ValueError(f"No extractable content found from URL: {url}")

            client = await self.db.client

            entry_data = {
                'agent_id': agent_id,
                'account_id': account_id,
                'name': f"🔗 {url}",
                'description': f"Content extracted from URL: {url}",
                'content': content[:self.MAX_CONTENT_LENGTH],
                'usage_context': 'always',
                'is_active': True,
                'source_type': extracted_source_type,
                'source_metadata': extracted_source_metadata,
            }

            result = await client.table('agent_knowledge_base_entries').insert(entry_data).execute()

            if not result.data:
                raise Exception("Failed to create knowledge base entry from URL")

            return {
                'success': True,
                'entry_id': result.data[0]['entry_id'],
                'url': url,
                'content_length': len(content),
                'source_type': extracted_source_type
            }

        except Exception as e:
            logger.error(f"Error processing URL {url}: {str(e)}")
            return {
                'success': False,
                'url': url,
                'error': str(e)
            }

    async def process_text_content(
        self,
        agent_id: str,
        account_id: str,
        text_content: str,
        name: str = "Text Content",
        description: Optional[str] = None,
        source_type: str = "text_input",
        source_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        try:
            if not text_content or not text_content.strip():
                raise ValueError("Text content cannot be empty")

            client = await self.db.client

            entry_data = {
                'agent_id': agent_id,
                'account_id': account_id,
                'name': name,
                'description': description or f"Content from text input: {name}",
                'content': text_content[:self.MAX_CONTENT_LENGTH],
                'usage_context': 'always',
                'is_active': True,
                'source_type': source_type,
                'source_metadata': source_metadata or {},
            }

            result = await client.table('agent_knowledge_base_entries').insert(entry_data).execute()

            if not result.data:
                raise Exception("Failed to create knowledge base entry from text content")

            return {
                'success': True,
                'entry_id': result.data[0]['entry_id'],
                'name': name,
                'content_length': len(text_content),
                'source_type': source_type
            }

        except Exception as e:
            logger.error(f"Error processing text content: {str(e)}")
            return {
                'success': False,
                'name': name,
                'error': str(e)
            }

    async def _extract_youtube_transcript(self, url: str) -> str:
        video_id = self._get_youtube_video_id(url)
        if not video_id:
            raise ValueError(f"Invalid YouTube URL: {url}")

        try:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            transcript = transcript_list.find_transcript(['en', 'pt', 'es', 'fr', 'de'])
            
            # Prioritize manually created transcripts if available
            if transcript.is_generated:
                try:
                    manual_transcript = transcript_list.find_manually_created_transcript(['en', 'pt', 'es', 'fr', 'de'])
                    transcript_pieces = manual_transcript.fetch()
                except NoTranscriptFound:
                    transcript_pieces = transcript.fetch()
            else:
                transcript_pieces = transcript.fetch()

            transcript_text = " ".join([t['text'] for t in transcript_pieces])
            return self._sanitize_content(transcript_text)
        except NoTranscriptFound:
            logger.warning(f"No transcript found for YouTube video {url}")
            return ""
        except TranscriptsDisabled:
            logger.warning(f"Transcripts are disabled for YouTube video {url}")
            return ""
        except Exception as e:
            logger.error(f"Error fetching YouTube transcript for {url}: {str(e)}")
            raise

    def _get_youtube_video_id(self, url: str) -> Optional[str]:
        from urllib.parse import urlparse, parse_qs
        parsed_url = urlparse(url)
        if parsed_url.hostname in ('www.youtube.com', 'youtube.com'):
            return parse_qs(parsed_url.query).get('v', [None])[0]
        elif parsed_url.hostname == 'youtu.be':
            return parsed_url.path[1:]
        return None

    async def _extract_web_content(self, url: str) -> str:
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()  # Raise an HTTPError for bad responses (4xx or 5xx)
            soup = BeautifulSoup(response.text, 'html.parser')

            # Remove script and style elements
            for script_or_style in soup(['script', 'style']):
                script_or_style.extract()

            # Get text, clean up whitespace
            text = soup.get_text(separator=' ', strip=True)
            return self._sanitize_content(text)
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching web content from {url}: {str(e)}")
            raise ValueError(f"Failed to fetch web content: {e}")
        except Exception as e:
            logger.error(f"Error parsing web content from {url}: {str(e)}")
            raise

    def _sanitize_content(self, content: str) -> str:
        if not content:
            return content

        sanitized = ''.join(char for char in content if ord(char) >= 32 or char in '\n\r\t')
        sanitized = sanitized.replace('\x00', '').replace('\u0000', '')
        sanitized = sanitized.replace('\ufeff', '')
        sanitized = sanitized.replace('\r\n', '\n').replace('\r', '\n')
        sanitized = re.sub(r'\n{4,}', '\n\n\n', sanitized)

        return sanitized.strip()

async def process_url_background(
    job_id: str,
    agent_id: str,
    account_id: str,
    url: str,
    source_type: str
):
    """Background task to process uploaded URLs"""
    
    processor = ContentProcessor()
    client = await processor.db.client
    try:
        await client.rpc('update_agent_kb_job_status', {
            'p_job_id': job_id,
            'p_status': 'processing'
        }).execute()
        
        result = await processor.process_url_upload(
            agent_id, account_id, url, source_type
        )
        
        if result['success']:
            await client.rpc('update_agent_kb_job_status', {
                'p_job_id': job_id,
                'p_status': 'completed',
                'p_result_info': result,
                'p_entries_created': 1,
                'p_total_files': 1 # For URLs, it's typically one entry per URL
            }).execute()
        else:
            await client.rpc('update_agent_kb_job_status', {
                'p_job_id': job_id,
                'p_status': 'failed',
                'p_error_message': result.get('error', 'Unknown error')
            }).execute()
            
    except Exception as e:
        logger.error(f"Error in background URL processing for job {job_id}: {str(e)}")
        try:
            await client.rpc('update_agent_kb_job_status', {
                'p_job_id': job_id,
                'p_status': 'failed',
                'p_error_message': str(e)
            }).execute()
        except:
            pass

async def process_text_content_background(
    job_id: str,
    agent_id: str,
    account_id: str,
    text_content: str,
    name: str,
    description: Optional[str] = None,
    source_type: str = "text_input",
    source_metadata: Optional[Dict[str, Any]] = None
):
    """Background task to process raw text content"""
    
    processor = ContentProcessor()
    client = await processor.db.client
    try:
        await client.rpc('update_agent_kb_job_status', {
            'p_job_id': job_id,
            'p_status': 'processing'
        }).execute()
        
        result = await processor.process_text_content(
            agent_id, account_id, text_content, name, description, source_type, source_metadata
        )
        
        if result['success']:
            await client.rpc('update_agent_kb_job_status', {
                'p_job_id': job_id,
                'p_status': 'completed',
                'p_result_info': result,
                'p_entries_created': 1,
                'p_total_files': 1
            }).execute()
        else:
            await client.rpc('update_agent_kb_job_status', {
                'p_job_id': job_id,
                'p_status': 'failed',
                'p_error_message': result.get('error', 'Unknown error')
            }).execute()
            
    except Exception as e:
        logger.error(f"Error in background text content processing for job {job_id}: {str(e)}")
        try:
            await client.rpc('update_agent_kb_job_status', {
                'p_job_id': job_id,
                'p_status': 'failed',
                'p_error_message': str(e)
            }).execute()
        except:
            pass