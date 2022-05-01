import { DependencyList, useEffect, useLayoutEffect, useRef } from "react";

export function useSyncRef<T>(value: T): React.MutableRefObject<T> {
    const ref = useRef(value);
    useLayoutEffect(() => void (ref.current = value));
    return ref;
}

export const useMemoRef = <T>(value: T, deps: DependencyList) => {
    const ref = useRef(value);
    useEffect(() => void (ref.current = value), deps);
    return ref;
};
