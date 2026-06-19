import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Polls an async fetcher function on a fixed interval.
 *
 * Handles three states explicitly (loading / error / data) so every
 * consumer component can render loading, error, and empty states
 * without re-implementing this logic.
 *
 * @param {Function} fetcher - async function returning data
 * @param {number} intervalMs - polling interval in milliseconds
 * @param {Array} deps - dependency array; re-subscribes when these change
 */
export function usePolling(fetcher, intervalMs = 5000, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const run = async () => {
      if (!isMounted) return;
      await load();
    };

    run();
    const id = setInterval(run, intervalMs);

    // Cleanup: clear the interval and prevent state updates after unmount.
    return () => {
      isMounted = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, refetch: load };
}
