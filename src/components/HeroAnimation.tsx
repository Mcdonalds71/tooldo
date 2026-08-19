import {
  ArrowsInLineHorizontalIcon,
  CheckCircleIcon,
  FileImageIcon,
  ImagesIcon,
} from '@phosphor-icons/react/dist/ssr';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useReducedMotion } from '../design-system/motion';
import './HeroAnimation.css';

export function HeroAnimation() {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<'idle' | 'compressing' | 'done'>('idle');

  useEffect(() => {
    if (reduced) return;

    let isSubscribed = true;

    const loop = async () => {
      // Small initial wait so it doesn't snap instantly on load
      await new Promise((r) => setTimeout(r, 600));

      while (isSubscribed) {
        setPhase('idle');
        await new Promise((r) => setTimeout(r, 1200));
        if (!isSubscribed) break;

        setPhase('compressing');
        await new Promise((r) => setTimeout(r, 2000));
        if (!isSubscribed) break;

        setPhase('done');
        await new Promise((r) => setTimeout(r, 2000));
      }
    };

    loop();

    return () => {
      isSubscribed = false;
    };
  }, [reduced]);

  if (reduced) {
    return (
      <div className="hero-anim">
        <ImagesIcon size="3rem" weight="duotone" className="hero-anim__icon" />
      </div>
    );
  }

  return (
    <div className="hero-anim">
      <div className="hero-anim__stage">
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div
              key="idle"
              className="hero-anim__box"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
            >
              <FileImageIcon size="2.5rem" weight="duotone" className="hero-anim__icon" />
            </motion.div>
          )}

          {phase === 'compressing' && (
            <motion.div
              key="compressing"
              className="hero-anim__box hero-anim__box--compressing"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: [1, 0.95, 0.9, 0.85, 0.8] }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 1.8, ease: 'easeInOut' }}
            >
              <ArrowsInLineHorizontalIcon
                size="2.5rem"
                weight="duotone"
                className="hero-anim__icon hero-anim__icon--action"
              />
              <motion.div
                className="hero-anim__progress"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.8, ease: 'linear' }}
              />
            </motion.div>
          )}

          {phase === 'done' && (
            <motion.div
              key="done"
              className="hero-anim__box hero-anim__box--done"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              <CheckCircleIcon
                size="2.5rem"
                weight="fill"
                className="hero-anim__icon hero-anim__icon--success"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
