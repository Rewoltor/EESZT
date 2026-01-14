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
            model: 'gpt-4o', // or gpt-4-turbo or gpt-3.5-turbo depending on preference
            messages: messages,
            temperature: 0.7
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
