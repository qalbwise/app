import { AnimatePresence, motion } from "motion/react";
import { useNetworkState } from "react-use";
import { duration, easing } from "@/lib/motions";

export function OfflineIndicator() {
  const { online } = useNetworkState();

  return (
    <AnimatePresence>
      {online === false && (
        <motion.div
          key="offline-indicator"
          role="status"
          aria-live="assertive"
          initial={{ y: "-100%", opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            transition: { duration: duration.fast, ease: easing.out },
          }}
          exit={{
            y: "-100%",
            opacity: 0,
            transition: { duration: duration.instant, ease: easing.out },
          }}
          className="flex items-center justify-center gap-2 bg-nugget-200 px-4 py-2 font-medium text-[13px] text-nugget-900"
        >
          <span aria-hidden="true">&#x26A0;</span>
          <span>You are offline. Some features may be unavailable.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
