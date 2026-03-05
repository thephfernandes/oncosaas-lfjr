"""
Multi-LLM provider abstraction.
Supports Anthropic (Claude) and OpenAI (GPT-4), configurable per tenant.
"""

from typing import Dict, List, Optional, Any
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
import logging
import os
from pathlib import Path
from dotenv import dotenv_values

logger = logging.getLogger(__name__)


class LLMProvider:
    """Abstração para múltiplos provedores LLM, configurável por tenant."""

    def __init__(self):
        self._anthropic_client: Optional[AsyncAnthropic] = None
        self._openai_client: Optional[AsyncOpenAI] = None

    def _looks_like_placeholder(self, value: Optional[str]) -> bool:
        if not value:
            return True
        normalized = value.strip().lower()
        return normalized in {
            "",
            "your-openai-api-key",
            "your-anthropic-api-key",
            "none",
            "null",
        }

    def _read_dotenv_key(self, key_name: str) -> Optional[str]:
        """
        Resolve API keys from local files first to avoid stale OS env overrides.
        Priority:
        1) ai-service/.env
        2) project root ../.env
        """
        service_root = Path(__file__).resolve().parents[2]  # ai-service/
        project_root = service_root.parent                  # repo root

        for env_path in (service_root / ".env", project_root / ".env"):
            if not env_path.exists():
                continue
            values = dotenv_values(env_path)
            value = values.get(key_name)
            if value and not self._looks_like_placeholder(value):
                return value.strip()

        return None

    def _resolve_api_key(self, key_name: str, explicit_key: Optional[str]) -> Optional[str]:
        # Explicit runtime key has highest priority.
        if explicit_key and not self._looks_like_placeholder(explicit_key):
            return explicit_key.strip()

        # Then prefer .env file values over process environment variables.
        file_key = self._read_dotenv_key(key_name)
        if file_key:
            return file_key

        env_key = os.getenv(key_name)
        if env_key and not self._looks_like_placeholder(env_key):
            return env_key.strip()

        return None

    def _get_anthropic_client(self, api_key: Optional[str] = None) -> Optional[AsyncAnthropic]:
        """Get or create Anthropic client."""
        key = self._resolve_api_key("ANTHROPIC_API_KEY", api_key)
        if not key:
            return None
        return AsyncAnthropic(api_key=key)

    def _get_openai_client(self, api_key: Optional[str] = None) -> Optional[AsyncOpenAI]:
        """Get or create OpenAI client."""
        key = self._resolve_api_key("OPENAI_API_KEY", api_key)
        if not key:
            return None
        return AsyncOpenAI(api_key=key)

    async def generate(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        config: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Generate a response using the configured LLM provider.

        Args:
            system_prompt: System prompt for the LLM
            messages: Conversation history [{role, content}]
            config: Agent configuration with provider details

        Returns:
            Generated text response
        """
        config = config or {}
        provider = config.get("llm_provider", "anthropic")
        model = config.get("llm_model", "claude-sonnet-4-6")

        # Try primary provider
        try:
            if provider == "anthropic":
                return await self._call_anthropic(system_prompt, messages, model, config)
            elif provider == "openai":
                return await self._call_openai(system_prompt, messages, model, config)
            else:
                raise ValueError(f"Provider não suportado: {provider}")
        except Exception as e:
            logger.error(f"Primary LLM ({provider}/{model}) failed: {e}")

            # Try fallback provider
            fallback_provider = config.get("llm_fallback_provider")
            fallback_model = config.get("llm_fallback_model")

            if fallback_provider and fallback_model:
                logger.info(f"Trying fallback: {fallback_provider}/{fallback_model}")
                try:
                    if fallback_provider == "anthropic":
                        return await self._call_anthropic(
                            system_prompt, messages, fallback_model, config
                        )
                    elif fallback_provider == "openai":
                        return await self._call_openai(
                            system_prompt, messages, fallback_model, config
                        )
                except Exception as fallback_error:
                    logger.error(f"Fallback LLM also failed: {fallback_error}")

            # Return a safe fallback response
            return self._fallback_response()

    async def generate_with_tools(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        tools: List[Dict[str, Any]],
        config: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate a response with tool use for structured extraction.

        Args:
            system_prompt: System prompt
            messages: Conversation history
            tools: Tool definitions for function calling
            config: Agent configuration

        Returns:
            Dict with response text and any tool calls
        """
        config = config or {}
        provider = config.get("llm_provider", "anthropic")
        model = config.get("llm_model", "claude-sonnet-4-6")

        if provider == "anthropic":
            return await self._call_anthropic_with_tools(
                system_prompt, messages, tools, model, config
            )
        elif provider == "openai":
            return await self._call_openai_with_tools(
                system_prompt, messages, tools, model, config
            )
        else:
            return {"response": self._fallback_response(), "tool_calls": []}

    async def _call_anthropic(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        model: str,
        config: Dict[str, Any],
    ) -> str:
        """Call Anthropic Claude API."""
        api_key = config.get("anthropic_api_key")
        client = self._get_anthropic_client(api_key)

        if not client:
            raise RuntimeError("Anthropic API key not configured")

        # Anthropic uses system as a separate parameter
        anthropic_messages = [
            {"role": m["role"], "content": m["content"]}
            for m in messages
            if m["role"] != "system"
        ]

        response = await client.messages.create(
            model=model,
            max_tokens=1024,
            system=system_prompt,
            messages=anthropic_messages,
        )

        return response.content[0].text

    async def _call_openai(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        model: str,
        config: Dict[str, Any],
    ) -> str:
        """Call OpenAI GPT API."""
        api_key = config.get("openai_api_key")
        client = self._get_openai_client(api_key)

        if not client:
            raise RuntimeError("OpenAI API key not configured")

        openai_messages = [{"role": "system", "content": system_prompt}]
        for m in messages:
            if m["role"] != "system":
                openai_messages.append({"role": m["role"], "content": m["content"]})

        response = await client.chat.completions.create(
            model=model,
            messages=openai_messages,
            temperature=0.7,
            max_tokens=1024,
        )

        return response.choices[0].message.content or ""

    async def _call_anthropic_with_tools(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        tools: List[Dict[str, Any]],
        model: str,
        config: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Call Anthropic with tool use."""
        api_key = config.get("anthropic_api_key")
        client = self._get_anthropic_client(api_key)

        if not client:
            return {"response": self._fallback_response(), "tool_calls": []}

        anthropic_messages = [
            {"role": m["role"], "content": m["content"]}
            for m in messages
            if m["role"] != "system"
        ]

        response = await client.messages.create(
            model=model,
            max_tokens=1024,
            system=system_prompt,
            messages=anthropic_messages,
            tools=tools,
        )

        text_response = ""
        tool_calls = []

        for block in response.content:
            if block.type == "text":
                text_response = block.text
            elif block.type == "tool_use":
                tool_calls.append({
                    "id": block.id,
                    "name": block.name,
                    "input": block.input,
                })

        return {"response": text_response, "tool_calls": tool_calls}

    async def _call_openai_with_tools(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        tools: List[Dict[str, Any]],
        model: str,
        config: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Call OpenAI with function calling."""
        api_key = config.get("openai_api_key")
        client = self._get_openai_client(api_key)

        if not client:
            return {"response": self._fallback_response(), "tool_calls": []}

        openai_messages = [{"role": "system", "content": system_prompt}]
        for m in messages:
            if m["role"] != "system":
                openai_messages.append({"role": m["role"], "content": m["content"]})

        # Convert tools to OpenAI function format
        openai_tools = [
            {
                "type": "function",
                "function": {
                    "name": t["name"],
                    "description": t.get("description", ""),
                    "parameters": t.get("input_schema", {}),
                },
            }
            for t in tools
        ]

        response = await client.chat.completions.create(
            model=model,
            messages=openai_messages,
            tools=openai_tools if openai_tools else None,
            temperature=0.7,
            max_tokens=1024,
        )

        choice = response.choices[0]
        text_response = choice.message.content or ""
        tool_calls = []

        if choice.message.tool_calls:
            import json

            for tc in choice.message.tool_calls:
                tool_calls.append({
                    "id": tc.id,
                    "name": tc.function.name,
                    "input": json.loads(tc.function.arguments),
                })

        return {"response": text_response, "tool_calls": tool_calls}

    @staticmethod
    def _fallback_response() -> str:
        """Return a safe fallback when no LLM is available."""
        return (
            "Sua mensagem foi registrada. No momento, nosso sistema de IA está "
            "sendo configurado. Um membro da equipe de enfermagem será notificado "
            "para dar continuidade ao seu atendimento."
        )


# Global instance
llm_provider = LLMProvider()
