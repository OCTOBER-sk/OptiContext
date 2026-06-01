import { useState, useCallback } from 'react';

export function useCopy() {
  const [state, setState] = useState<'idle' | 'success'>('idle');

  const copy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setState('success');
    window.setTimeout(() => setState('idle'), 1500);
  }, []);

  return { copy, state };
}
