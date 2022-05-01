import { AnyFunction } from "@pastable/core";

export function debounce<Fn extends AnyFunction>(fn: Fn, wait = 100): Fn {
    let timeout: any;
    return function (...args: any[]) {
        clearTimeout(timeout);
        // @ts-ignore
        timeout = setTimeout(() => fn.call(this, ...args), wait);
    } as Fn;
}
