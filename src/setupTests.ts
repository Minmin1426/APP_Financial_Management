import '@testing-library/jest-dom';
import { webcrypto } from 'node:crypto';

// Polyfill Web Crypto API cho môi trường JSDOM của Jest (cho crypto.randomUUID)
if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
} else if (typeof globalThis.crypto.randomUUID !== 'function') {
  (globalThis as any).crypto.randomUUID = () => webcrypto.randomUUID();
}

// Polyfill structuredClone cho môi trường chạy test JSDOM của Jest
if (typeof globalThis.structuredClone === 'undefined') {
  (globalThis as any).structuredClone = function (val: any) {
    if (val === undefined) return undefined;
    return JSON.parse(JSON.stringify(val));
  };
}
