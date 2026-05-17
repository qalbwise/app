import { useRegisterSW } from "virtual:pwa-register/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { duration, easing } from "@/lib/motions";

export function PwaUpdatePrompt() {
  const [visible, setVisible] = useState(false);
  const reloadingRef = useRef(false);
  const pollIntervalRef = useRef<number | null>(null);

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

  return (
    <AnimatePresence>
      {needRefresh && visible && (
        <motion.div
          key="pwa-update-prompt"
          role="status"
          aria-live="polite"
          initial={{ y: 100, opacity: 0, x: "-50%" }}
          animate={{
            y: 0,
            opacity: 1,
            x: "-50%",
            transition: { duration: duration.normal, ease: easing.out },
          }}
          exit={{
            y: 100,
            opacity: 0,
            x: "-50%",
            transition: { duration: duration.fast, ease: easing.out },
          }}
          className="fixed bottom-6 left-1/2 z-9999 flex items-center gap-3 whitespace-nowrap rounded-full border border-black/10 bg-background px-4.5 py-2.5 text-[14px] text-secondary-foreground shadow-[0_4px_24px_rgba(0,0,0,0.12),0_1px_4px_rgba(0,0,0,0.06)]"
        >
          <span>A new version is available.</span>
          <motion.button
            type="button"
            onClick={handleUpdate}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: duration.instant, ease: easing.out }}
            className="rounded-full bg-foreground px-3.5 py-1 font-semibold text-[13px] text-primary-foreground tracking-[0.01em]"
          >
            Update
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setVisible(false)}
            aria-label="Dismiss update prompt"
            whileTap={{ scale: 0.97 }}
            transition={{ duration: duration.instant, ease: easing.out }}
            className="border-none bg-transparent p-1 text-[16px] text-secondary-foreground leading-none"
          >
            ✕
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
