"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface MindexLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const MindexLoader: React.FC<MindexLoaderProps> = ({
  size = "md",
  className,
}) => {
  const letters = "Mindex".split("");
  const [dotCount, setDotCount] = useState(1);

  // Hiệu ứng chạy dấu chấm . .. ...
  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const sizeMap = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
    xl: "text-7xl",
  };

  const letterDuration = 0.4; // Thời gian 1 chữ nhảy lên và xuống
  const totalLetters = letters.length;
  const cycleDuration = (totalLetters + 1) * letterDuration; // +1 cho khoảng nghỉ hoặc dấu chấm

  return (
    <div className={cn("flex items-center justify-center select-none", className)} translate="no">
      <div
        className={cn(
          "flex items-baseline font-light tracking-tight transition-all duration-500",
          sizeMap[size],
          "text-slate-300 drop-shadow-[0_0_10px_rgba(200,200,200,0.3)]"
        )}
        translate="no"
      >
        {letters.map((letter, i) => (
          <motion.span
            key={i}
            initial={{ y: 0 }}
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: letterDuration,
              delay: i * letterDuration,
              repeat: Infinity,
              repeatDelay: cycleDuration - letterDuration,
              ease: "easeInOut",
            }}
            className="inline-block"
            translate="no"
          >
            {letter}
          </motion.span>
        ))}

        <div className="flex ml-1 w-[1.5em]" translate="no">
          <AnimatePresence mode="wait">
            <motion.span
              key={dotCount}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="inline-block"
              translate="no"
            >
              {".".repeat(dotCount)}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MindexLoader;
