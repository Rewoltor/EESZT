/**
 * OpenAI API Helper
 * Handles key storage and chat completion requests
 */

const KEY_STORAGE_NAME = 'openai_api_key';

export function getStoredApiKey(): string | null {
    return localStorage.getItem(KEY_STORAGE_NAME);
}

export function saveApiKey(key: string) {
    localStorage.setItem(KEY_STORAGE_NAME, key);
}

export function clearApiKey() {
    localStorage.removeItem(KEY_STORAGE_NAME);
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        return response.ok;
    } catch (e) {
        console.error('API Validation Error:', e);
        return false;
    }
}

export async function sendChatRequest(messages: ChatMessage[], apiKey: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: messages,
            temperature: 1
        })
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Hibás API kulcs. Kérlek ellenőrizd és próbáld újra.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API Hiba: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

export async function sendChatStream(
    messages: ChatMessage[],
    apiKey: string,
    onChunk: (chunk: string) => void
): Promise<void> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: messages,
            temperature: 1,
            stream: true
        })
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Hibás API kulcs. Kérlek ellenőrizd és próbáld újra.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API Hiba: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');

    if (!reader) {
        throw new Error('Response body is unavailable for streaming.');
    }

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
            const message = line.replace(/^data: /, '');
            if (message === '[DONE]') {
                return;
            }
            try {
                const parsed = JSON.parse(message);
                const content = parsed.choices[0].delta.content;
                if (content) {
                    onChunk(content);
                }
            } catch (e) {
                console.error('Error parsing stream chunk', e);
            }
        }
    }
}
