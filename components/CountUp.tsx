"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

export default function CountUp({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const spring = useSpring(0, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [shown, setShown] = useState(0);

  useEffect(() => {
    spring.set(value);
    return display.on("change", (v) => setShown(v));
  }, [value, spring, display]);

  return (
    <motion.span className={className} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {shown}
    </motion.span>
  );
}
