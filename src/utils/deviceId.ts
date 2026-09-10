import { randomUUID } from "expo-crypto";
import { storage } from "./storage";
import { CONFIG } from "../constants/config";
export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await storage.getItem(CONFIG.SESSION_STORE_KEYS.DEVICE_ID);
  if (existing) return existing;
  const id = randomUUID();
  await storage.setItem(CONFIG.SESSION_STORE_KEYS.DEVICE_ID, id);
  return id;
}
