import { ProviderModel } from "./prompt-agent.js";

/**
 * Not all of these are validated, 
 *  only openai and anthropic are validated
 */
export const defaultModels: Record< "openai-assistant" | ProviderModel, string> = {
    "openai-assistant": "gpt-4o",
    "openai": "gpt-4o",
    "azure": "gpt-4",
    "anthropic": "claude-3-7-sonnet-20250219",
    "amazon-bedrock": "meta.llama3-70b-instruct-v1:0",
    "google-gemini": "gemini-1.5-pro-latest",
    "google-vertex": "gemini-1.5-pro",
    "mistral": "mistral-large-latest",
    "xai": "xai-v1-preview",
    "together": "together-llama-3-70b-v1",
    "fireworks": "fireworks-v2-flash-instruct",
    "deepinfra": "deepseek-coder",
    "deepseek": "deepseek-coder",
    "cerebras": "cerebras-gpt-111m-v2",
    "groq": "llama-3-70b-8192",
    "ollama": "llama3.1",
    "perplexity": "gemma2-9b-it"
}

export const defaultMaxTokens: Record<string, number> = {
    "openai/gpt-4o-mini": 4096,
    "openai/gpt-4o": 8192,
    "anthropic/claude-3-7-sonnet-20250219": 64000,
    "anthrpic/claude-3-5-sonnet-20241022": 8192,
}

export function getProviderDefaults(provider: ProviderModel): {model: string, maxTokens?: number} {
    const model = defaultModels[provider];
    const maxTokens = defaultMaxTokens[provider+'/'+model];
    return { model, maxTokens };
}