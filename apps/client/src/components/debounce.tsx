export function debounce(fn, wait = 100) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.call(this, ...args), wait);
    };
}
