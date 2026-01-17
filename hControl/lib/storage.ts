import { get, set, del, clear } from 'idb-keyval';
import type { BloodTestResult, StoredBloodData } from '@/types/blood-results';
import type { ChatMessage, LLMSettings } from '@/types/llm';

/**
 * Storage keys for IndexedDB
 */
export const STORAGE_KEYS = {
    BLOOD_RESULTS: 'bloodResults',
    BLOOD_FULL_TEXT: 'bloodFullText',
    CHAT_HISTORY: 'chatHistory',
    LLM_SETTINGS: 'llmSettings',
} as const;

/**
 * Centralized storage utility using IndexedDB
 * All medical data is stored client-side only
 */
export const storage = {
    // Generic operations
    get: async <T>(key: string): Promise<T | undefined> => {
        return await get<T>(key);
    },

    set: async (key: string, val: unknown): Promise<void> => {
        await set(key, val);
    },

    del: async (key: string): Promise<void> => {
        await del(key);
    },

    clear: async (): Promise<void> => {
        await clear();
    },

    // Blood test results
    saveBloodResults: async (data: StoredBloodData): Promise<void> => {
        await set(STORAGE_KEYS.BLOOD_RESULTS, data);
    },

    getBloodResults: async (): Promise<StoredBloodData | undefined> => {
        return await get<StoredBloodData>(STORAGE_KEYS.BLOOD_RESULTS);
    },

    // Full PDF text for LLM context
    saveFullText: async (text: string): Promise<void> => {
        await set(STORAGE_KEYS.BLOOD_FULL_TEXT, text);
    },

    getFullText: async (): Promise<string | undefined> => {
        return await get<string>(STORAGE_KEYS.BLOOD_FULL_TEXT);
    },

    // Chat history
    saveChatHistory: async (messages: ChatMessage[]): Promise<void> => {
        await set(STORAGE_KEYS.CHAT_HISTORY, messages);
    },

    getChatHistory: async (): Promise<ChatMessage[] | undefined> => {
        return await get<ChatMessage[]>(STORAGE_KEYS.CHAT_HISTORY);
    },

    // LLM settings (API key, provider)
    saveLLMSettings: async (settings: LLMSettings): Promise<void> => {
        await set(STORAGE_KEYS.LLM_SETTINGS, settings);
    },

    getLLMSettings: async (): Promise<LLMSettings | undefined> => {
        return await get<LLMSettings>(STORAGE_KEYS.LLM_SETTINGS);
    },

    // Delete all data
    deleteAllData: async (): Promise<void> => {
        await clear();
    },

    // Check if data exists
    hasData: async (): Promise<boolean> => {
        const data = await get<StoredBloodData>(STORAGE_KEYS.BLOOD_RESULTS);
        return data !== undefined && data.results.length > 0;
    },
};
