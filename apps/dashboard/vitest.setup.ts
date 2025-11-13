import { Buffer } from 'node:buffer';
import { createHash, webcrypto } from 'node:crypto';

if (typeof globalThis.crypto === 'undefined') {
  // @ts-expect-error assigning node webcrypto to global
  globalThis.crypto = webcrypto;
}

if (typeof (globalThis as { crypto: { hash?: unknown } }).crypto.hash !== 'function') {
  (globalThis as { crypto: typeof webcrypto & { hash?: unknown } }).crypto.hash = (
    algorithm: string,
    data: string | Buffer,
    encoding: BufferEncoding = 'hex'
  ) => {
    const hash = createHash(algorithm);
    hash.update(typeof data === 'string' ? data : Buffer.from(data));
    return hash.digest(encoding);
  };
}

if (typeof globalThis.window === 'undefined') {
  // Minimal window polyfill for Vue Router in tests
  // @ts-expect-error vitest jsdom replacement not loaded yet
  globalThis.window = {} as Window;
}
