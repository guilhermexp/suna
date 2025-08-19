from typing import Dict, Any, Union, Optional, List
from agentpress.tool import Tool, openapi_schema, usage_example
from services.llm import make_llm_api_call
from services.supabase import DBConnection
from utils.logger import logger

class TextEnhancementTool(Tool):
    def __init__(self, db: DBConnection):
        super().__init__()
        self.db = db
        logger.info("TextEnhancementTool initialized.")

    @openapi_schema({
        "name": "summarize_text",
        "description": "Summarizes a given text into a concise version. Useful for extracting key information or creating brief overviews.",
        "parameters": {
            "type": "object",
            "properties": {
                "text": {
                    "type": "string",
                    "description": "The text to be summarized."
                },
                "length": {
                    "type": "string",
                    "enum": ["short", "medium", "long"],
                    "description": "Desired length of the summary. Defaults to 'short'."
                }
            },
            "required": ["text"]
        }
    })
    @usage_example("tool_code:print(text_enhancement_tool.summarize_text(text=\"The quick brown fox jumps over the lazy dog.\", length=\"short\"))")
    async def summarize_text(self, text: str, length: str = "short") -> Dict[str, Any]:
        """Summarizes a given text into a concise version."""
        try:
            system_prompt = f"You are a text summarizer. Summarize the provided text to be {length}. Focus on key information and main points."
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ]
            
            # Assuming a default LLM model for this tool
            response = await make_llm_api_call(messages=messages, model_name="gpt-4o-mini", max_tokens=500, temperature=0.7)
            
            if response and response.get('choices') and response['choices'][0].get('message'):
                summary = response['choices'][0]['message'].get('content', '').strip()
                return self.success_response({"original_text": text, "summary": summary})
            else:
                return self.fail_response(f"LLM did not return a valid summary for text: {text[:50]}...")
        except Exception as e:
            logger.error(f"Error summarizing text: {e}")
            return self.fail_response(f"Failed to summarize text: {e}")

    @openapi_schema({
        "name": "rephrase_text",
        "description": "Rephrases a given text to change its style or tone, while preserving its original meaning. Useful for making text more formal, informal, or neutral.",
        "parameters": {
            "type": "object",
            "properties": {
                "text": {
                    "type": "string",
                    "description": "The text to be rephrased."
                },
                "style": {
                    "type": "string",
                    "enum": ["formal", "informal", "neutral", "professional", "creative"],
                    "description": "Desired style for rephrasing. Defaults to 'neutral'."
                }
            },
            "required": ["text"]
        }
    })
    @usage_example("tool_code:print(text_enhancement_tool.rephrase_text(text=\"This is a casual message.\", style=\"formal\"))")
    async def rephrase_text(self, text: str, style: str = "neutral") -> Dict[str, Any]:
        """Rephrases a given text to change its style or tone."""
        try:
            system_prompt = f"You are a text rephraser. Rephrase the provided text in a {style} style, maintaining its original meaning."
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ]
            
            response = await make_llm_api_call(messages=messages, model_name="gpt-4o-mini", max_tokens=1000, temperature=0.7)
            
            if response and response.get('choices') and response['choices'][0].get('message'):
                rephrased_text = response['choices'][0]['message'].get('content', '').strip()
                return self.success_response({"original_text": text, "rephrased_text": rephrased_text})
            else:
                return self.fail_response(f"LLM did not return a valid rephrased text for: {text[:50]}...")
        except Exception as e:
            logger.error(f"Error rephrasing text: {e}")
            return self.fail_response(f"Failed to rephrase text: {e}")

    @openapi_schema({
        "name": "correct_grammar",
        "description": "Corrects grammatical errors, spelling mistakes, and punctuation in a given text. Useful for improving clarity and professionalism.",
        "parameters": {
            "type": "object",
            "properties": {
                "text": {
                    "type": "string",
                    "description": "The text to be corrected."
                }
            },
            "required": ["text"]
        }
    })
    @usage_example("tool_code:print(text_enhancement_tool.correct_grammar(text=\"He go to the store.\"))")
    async def correct_grammar(self, text: str) -> Dict[str, Any]:
        """Corrects grammatical errors, spelling mistakes, and punctuation."""
        try:
            system_prompt = "You are a grammar and spelling corrector. Correct any grammatical errors, spelling mistakes, and punctuation in the provided text. Return only the corrected text."
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ]
            
            response = await make_llm_api_call(messages=messages, model_name="gpt-4o-mini", max_tokens=1000, temperature=0.7)
            
            if response and response.get('choices') and response['choices'][0].get('message'):
                corrected_text = response['choices'][0]['message'].get('content', '').strip()
                return self.success_response({"original_text": text, "corrected_text": corrected_text})
            else:
                return self.fail_response(f"LLM did not return a valid corrected text for: {text[:50]}...")
        except Exception as e:
            logger.error(f"Error correcting grammar: {e}")
            return self.fail_response(f"Failed to correct grammar: {e}")

    @openapi_schema({
        "name": "expand_text",
        "description": "Expands a concise text into a more detailed and elaborate version. Useful for adding more context, examples, or explanations.",
        "parameters": {
            "type": "object",
            "properties": {
                "text": {
                    "type": "string",
                    "description": "The text to be expanded."
                },
                "detail_level": {
                    "type": "string",
                    "enum": ["low", "medium", "high"],
                    "description": "Desired level of detail for expansion. Defaults to 'medium'."
                }
            },
            "required": ["text"]
        }
    })
    @usage_example("tool_code:print(text_enhancement_tool.expand_text(text=\"AI is powerful.\", detail_level=\"high\"))")
    async def expand_text(self, text: str, detail_level: str = "medium") -> Dict[str, Any]:
        """Expands a concise text into a more detailed and elaborate version."""
        try:
            system_prompt = f"You are a text expander. Expand the provided text into a more detailed version with {detail_level} level of detail. Add relevant context, examples, or explanations."
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ]
            
            response = await make_llm_api_call(messages=messages, model_name="gpt-4o-mini", max_tokens=1500, temperature=0.7)
            
            if response and response.get('choices') and response['choices'][0].get('message'):
                expanded_text = response['choices'][0]['message'].get('content', '').strip()
                return self.success_response({"original_text": text, "expanded_text": expanded_text})
            else:
                return self.fail_response(f"LLM did not return a valid expanded text for: {text[:50]}...")
        except Exception as e:
            logger.error(f"Error expanding text: {e}")
            return self.fail_response(f"Failed to expand text: {e}")
