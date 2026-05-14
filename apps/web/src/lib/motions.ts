export const easing = {
  out: [0.16, 1, 0.3, 1] as const,
  in: [0.7, 0, 0.84, 0] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
  outQuart: [0.25, 1, 0.5, 1] as const,
  outQuint: [0.22, 1, 0.36, 1] as const,
};

export const duration = {
  instant: 0.15,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  entrance: 0.6,
};

export const transition = {
  instant: { duration: duration.instant, ease: easing.out },
  fast: { duration: duration.fast, ease: easing.out },
  normal: { duration: duration.normal, ease: easing.out },
  slow: { duration: duration.slow, ease: easing.out },
  entrance: { duration: duration.entrance, ease: easing.out },
};

export const variants = {
  fadeUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
  },
  staggerContainer: {
    initial: {},
    animate: {
      transition: { staggerChildren: 0.06, delayChildren: 0.1 },
    },
  },
  staggerContainerSlow: {
    initial: {},
    animate: {
      transition: { staggerChildren: 0.08, delayChildren: 0.25 },
    },
  },
  staggerItem: {
    initial: { opacity: 0, y: 16 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: duration.normal, ease: easing.out },
    },
  },
};
