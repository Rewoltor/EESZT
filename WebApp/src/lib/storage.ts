import { get, set, del, clear } from 'idb-keyval';
import type { BloodTestResult } from '../types/blood-results';
import type { ChatMessage } from './openai';

// Define keys to obtain type safety if needed, though idb-keyval is loose
export const STORAGE_KEYS = {
    BLOOD_RESULTS: 'bloodResults',
    BLOOD_FULL_TEXT: 'bloodFullText',
    CHAT_HISTORY: 'chatHistory'
};

export interface StoredBloodData {
    results: BloodTestResult[];
    processedAt: string;
    fileCount: number;
}

export const storage = {
    // Generic get
    get: async <T>(key: string): Promise<T | undefined> => {
        return await get<T>(key);
    },

    // Generic set
    set: async (key: string, val: unknown): Promise<void> => {
        await set(key, val);
    },

    // Generic delete
    del: async (key: string): Promise<void> => {
        await del(key);
    },

    // Clear all
    clear: async (): Promise<void> => {
        await clear();
    },

    // Specific helpers for our app data
    saveBloodResults: async (data: StoredBloodData) => {
        await set(STORAGE_KEYS.BLOOD_RESULTS, data);
    },

    getBloodResults: async (): Promise<StoredBloodData | undefined> => {
        return await get<StoredBloodData>(STORAGE_KEYS.BLOOD_RESULTS);
    },

    saveFullText: async (text: string) => {
        await set(STORAGE_KEYS.BLOOD_FULL_TEXT, text);
    },

    getFullText: async (): Promise<string | undefined> => {
        return await get<string>(STORAGE_KEYS.BLOOD_FULL_TEXT);
    },

    saveChatHistory: async (messages: ChatMessage[]) => {
        await set(STORAGE_KEYS.CHAT_HISTORY, messages);
    },

    getChatHistory: async (): Promise<ChatMessage[] | undefined> => {
        return await get<ChatMessage[]>(STORAGE_KEYS.CHAT_HISTORY);
    }
};
