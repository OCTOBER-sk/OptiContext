import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../components/ui/Toast';

export function useKeyReveal(apiKey: string, animateReveal: boolean, onRevealDone?: () => void) {
  const { toast } = useToast();
  const [stage, setStage] = useState<
    'idle' | 'card-fade-in' | 'glow-bloom' | 'char-reveal' | 'copy-slide' | 'scanline' | 'settled'
  >(animateReveal ? 'idle' : 'settled');

  const [revealed, setRevealed] = useState(!animateReveal);
  const [copied, setCopied] = useState(false);
  const [showCopy, setShowCopy] = useState(!animateReveal);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animateReveal) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setStage('card-fade-in'), 0));
    timers.push(setTimeout(() => setStage('glow-bloom'), 400));
    timers.push(setTimeout(() => { setRevealed(true); setStage('char-reveal'); }, 800));
    timers.push(setTimeout(() => { setShowCopy(true); setStage('copy-slide'); }, 2400));
    timers.push(setTimeout(() => setStage('scanline'), 2600));
    timers.push(setTimeout(() => { setStage('settled'); onRevealDone?.(); }, 2800));

    return () => timers.forEach(clearTimeout);
  }, [animateReveal, onRevealDone]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      if (cardRef.current) {
        const keyEl = cardRef.current.querySelector('.api-key-value');
        if (keyEl) {
          keyEl.classList.add('key-flash');
          setTimeout(() => keyEl.classList.remove('key-flash'), 200);
        }
      }
      toast('Agent key copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Failed to copy — please copy manually', 'error');
    }
  }, [apiKey, toast]);

  const handleRevealToggle = () => {
    if (stage !== 'settled') return;
    setRevealed((prev) => !prev);
  };

  const boxShadow =
    stage === 'glow-bloom' || stage === 'char-reveal' || stage === 'copy-slide' || stage === 'scanline'
      ? '0 0 80px rgba(34,197,94,0.25)'
      : '0 0 40px rgba(34,197,94,0.12)';

  const cardOpacity = stage === 'idle' ? 0 : 1;
  const cardTransform = stage === 'idle' ? 'translateY(20px)' : 'translateY(0)';

  return {
    stage,
    revealed,
    copied,
    showCopy,
    cardRef,
    handleCopy,
    handleRevealToggle,
    boxShadow,
    cardOpacity,
    cardTransform,
  };
}
