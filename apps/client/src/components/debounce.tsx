import { AnyFunction } from "@pastable/core";

export function debounce(fn: AnyFunction, wait = 100) {
    let timeout: any;
    return function (...args: any[]) {
        clearTimeout(timeout);
        // @ts-ignore
        timeout = setTimeout(() => fn.call(this, ...args), wait);
    };
}
