/**
 * Supported LLM providers
 */
export type LLMProvider = 'openai' | 'anthropic' | 'gemini';

/**
 * LLM settings stored in browser
 */
export interface LLMSettings {
    provider: LLMProvider;
    apiKey: string;
    model?: string; // Optional custom model override
}

/**
 * Chat message structure
 */
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string; // ISO timestamp
}

/**
 * LLM Adapter interface for unified API
 */
export interface LLMAdapter {
    /**
     * Send a message and get streaming response
     * @param messages - Chat history
     * @param context - Medical data context (full PDF text + extracted JSON)
     * @returns AsyncGenerator that yields text chunks
     */
    sendMessage(
        messages: ChatMessage[],
        context: string
    ): AsyncGenerator<string, void, unknown>;

    /**
     * Validate API key
     * @param apiKey - API key to validate
     * @returns true if valid
     */
    validateApiKey(apiKey: string): Promise<boolean>;
}

/**
 * LLM model configuration
 */
export interface LLMModelConfig {
    provider: LLMProvider;
    defaultModel: string;
    displayName: string;
    apiEndpoint: string;
}
