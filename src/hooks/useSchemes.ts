import {useCallback, useEffect, useState} from 'react';
import type {Scheme} from "../types/Scheme.ts";
import {loadSchemes} from "../config/schemes.ts";

let cachedSchemes: Promise<Scheme[]> | null = null;

function fetchSchemes(): Promise<Scheme[]> {
    if (!cachedSchemes) {
        cachedSchemes = loadSchemes();
    }
    return cachedSchemes;
}

export function useSchemes() {
    const [schemes, setSchemes] = useState<Scheme[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const retry = useCallback(() => {
        cachedSchemes = null;
        setLoading(true);
        setError(null);
        setSchemes([]);
        fetchSchemes()
            .then(setSchemes)
            .catch(err => setError(err instanceof Error ? err.message : String(err)))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetchSchemes()
            .then(data => {
                if (!cancelled) setSchemes(data);
            })
            .catch(err => {
                if (!cancelled) setError(err instanceof Error ? err.message : String(err));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return {schemes, loading, error, retry};
}
