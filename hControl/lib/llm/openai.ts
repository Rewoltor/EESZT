import type { ChatMessage } from '@/types/llm';

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

export async function sendChatStream(
    messages: { role: string; content: string }[],
    apiKey: string,
    onChunk: (chunk: string) => void
): Promise<void> {
    let response;
    try {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                temperature: 0.7,
                stream: true
            })
        });
    } catch (error) {
        console.error('Network Error:', error);
        throw new Error('Hálózati hiba: Nem sikerült elérni az OpenAI szervereit. Ellenőrizd az internetkapcsolatot és az API kulcsot.');
    }

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
                const content = parsed.choices[0]?.delta?.content;
                if (content) {
                    onChunk(content);
                }
            } catch (e) {
                console.error('Error parsing stream chunk', e);
            }
        }
    }
}
