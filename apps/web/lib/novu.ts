import { Novu } from "@novu/api";

let _client: Novu | null = null;

/**
 * Returns a singleton instance of the Novu API client.
 * Uses the NOVU_SECRET_KEY environment variable.
 * Returns null if the secret key is not configured.
 */
export function getNovuClient(): Novu | null {
  const secret = process.env["NOVU_SECRET_KEY"];
  if (!secret) return null;
  
  if (!_client) {
    _client = new Novu({ secretKey: secret });
  }
  
  return _client;
}
