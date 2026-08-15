import { createHash } from "crypto";

/** Hash de armazenamento do refresh token — nunca guardamos o token em texto puro no banco. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
