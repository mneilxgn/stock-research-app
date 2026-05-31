/**
 * Global serial request queue for Yahoo Finance.
 * Ensures at most 1 request every DELAY_MS across all data sources.
 */
const DELAY_MS = 1500;

const queue = [];
let processing = false;

async function processQueue() {
  if (processing) return;
  processing = true;

  while (queue.length > 0) {
    const { fn, resolve, reject } = queue.shift();
    try {
      const result = await fn();
      resolve(result);
    } catch (err) {
      reject(err);
    }
    if (queue.length > 0) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  processing = false;
}

export function throttledFetch(fn) {
  return new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    processQueue();
  });
}

export function queueDepth() {
  return queue.length;
}
