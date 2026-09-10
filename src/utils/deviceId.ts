import { storage } from './storage';
import { CONFIG } from '../constants/config';

function generateRandomHex(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function generateUuid(): string {
  return `${generateRandomHex(8)}-${generateRandomHex(4)}-4${generateRandomHex(3)}-8${generateRandomHex(3)}-${generateRandomHex(12)}`;
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await storage.getItem(CONFIG.SESSION_STORE_KEYS.DEVICE_ID);
  if (existing) {
    return existing;
  }
  const newId = generateUuid();
  await storage.setItem(CONFIG.SESSION_STORE_KEYS.DEVICE_ID, newId);
  return newId;
}
