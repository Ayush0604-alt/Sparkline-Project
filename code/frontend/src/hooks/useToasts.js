import { useState, useCallback, useRef } from 'react';

let idCounter = 0;

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef({});

  const pushToast = useCallback((message, type = 'info') => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);

    timeoutsRef.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timeoutsRef.current[id];
    }, 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
      delete timeoutsRef.current[id];
    }
  }, []);

  return { toasts, pushToast, dismissToast };
}
