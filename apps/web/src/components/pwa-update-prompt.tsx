import { useRegisterSW } from "virtual:pwa-register/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/**
 * PWA update banner — Motion for React (gestures + AnimatePresence) with
 * reduced-motion support: https://motion.dev/docs/react
 */
export const PwaUpdatePrompt = () => {
  const [visible, setVisible] = useState(false);
  const reloadingRef = useRef(false);
  const pollIntervalRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, reg) {
      if (pollIntervalRef.current !== null) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (!reg) return;
      pollIntervalRef.current = window.setInterval(() => {
        void reg.update();
      }, 60_000);
    },
    onNeedRefresh() {
      setVisible(true);
    },
  });

  useEffect(() => {
    if (!needRefresh) setVisible(false);
  }, [needRefresh]);

  useEffect(
    () => () => {
      if (pollIntervalRef.current !== null) {
        clearInterval(pollIntervalRef.current);
      }
    },
    []
  );

  useEffect(() => {
    const handler = () => {
      if (reloadingRef.current) return;
      reloadingRef.current = true;
    };
    navigator.serviceWorker?.addEventListener("controllerchange", handler);
    return () =>
      navigator.serviceWorker?.removeEventListener("controllerchange", handler);
  }, []);

  function handleUpdate() {
    if (reloadingRef.current) return;
    reloadingRef.current = true;
    setVisible(false);
    void updateServiceWorker(true);
  }

  const panelTransition = prefersReducedMotion
    ? { duration: 0.2, ease: "easeOut" as const }
    : { type: "spring" as const, stiffness: 320, damping: 28 };

  return (
    <AnimatePresence>
      {needRefresh && visible && (
        <motion.div
          key="pwa-update-prompt"
          role="status"
          aria-live="polite"
          initial={{ y: 100, opacity: 0, x: "-50%" }}
          animate={{ y: 0, opacity: 1, x: "-50%" }}
          exit={{ y: 100, opacity: 0, x: "-50%" }}
          transition={panelTransition}
          className="fixed bottom-6 left-1/2 z-9999 flex items-center gap-3 whitespace-nowrap rounded-full border border-black/10 bg-background px-4.5 py-2.5 text-[14px] text-secondary-foreground shadow-[0_4px_24px_rgba(0,0,0,0.12),0_1px_4px_rgba(0,0,0,0.06)]"
        >
          <span>A new version is available.</span>
          <motion.button
            type="button"
            onClick={handleUpdate}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.96 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
            className="rounded-full bg-foreground px-3.5 py-1 font-semibold text-[13px] text-primary-foreground tracking-[0.01em]"
          >
            Update
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setVisible(false)}
            aria-label="Dismiss update prompt"
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.92 }}
            className="border-none bg-transparent p-1 text-(--clr-placeholder) text-[16px] leading-none"
          >
            ✕
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
