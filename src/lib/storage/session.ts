import type { Session } from "@/types";
import { buildKey, get, remove, set } from "./db";

const SESSION_KEY = buildKey(null, "session");

export const sessionStore = {
  read(): Session | null {
    return get<Session | null>(SESSION_KEY, null);
  },
  write(session: Session): void {
    set(SESSION_KEY, session);
  },
  clear(): void {
    remove(SESSION_KEY);
  },
};
