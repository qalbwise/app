import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

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
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            zIndex: 9999,
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.1)",
            boxShadow:
              "0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)",
            borderRadius: "9999px",
            padding: "10px 18px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "14px",
            color: "#4e4e4e",
            whiteSpace: "nowrap",
          }}
        >
          <span>A new version is available.</span>
          <motion.button
            type="button"
            onClick={handleUpdate}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.96 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
            style={{
              background: "#000",
              color: "#fff",
              border: "none",
              borderRadius: "9999px",
              padding: "5px 14px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.01em",
            }}
          >
            Update
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setVisible(false)}
            aria-label="Dismiss update prompt"
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.92 }}
            style={{
              background: "transparent",
              border: "none",
              padding: "4px",
              cursor: "pointer",
              color: "#b0ada8",
              lineHeight: 1,
              fontSize: "16px",
            }}
          >
            ✕
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
