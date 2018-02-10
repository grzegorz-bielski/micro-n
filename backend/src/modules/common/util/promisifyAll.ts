import { promisify } from 'util';

// original idea: https://github.com/charlieduong94/util-promisifyAll/blob/master/index.js

export function promisifyAll(obj) {
  for (const key of Object.getOwnPropertyNames(obj)) {
    const descriptor = Object.getOwnPropertyDescriptor(obj, key);

    if (!descriptor.get) {
      const fun = obj[key];
      if (typeof fun === 'function') {
        obj[`${key}Async`] = promisify(fun);
      }
    }
  }
}
