import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).Buffer = Buffer;
  (window as any).process = {
    env: {},
    version: 'v18.0.0',
    nextTick: (callback: any) => setTimeout(callback, 0),
    browser: true,
  };
}

export {};
