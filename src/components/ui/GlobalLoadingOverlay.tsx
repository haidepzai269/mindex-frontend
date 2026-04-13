"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLoadingStore } from "@/store/useLoadingStore";
import MindexLoader from "./MindexLoader";

const GlobalLoadingOverlay: React.FC = () => {
  const { isLoading, message } = useLoadingStore();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/40 backdrop-blur-2xl"
        >
          <MindexLoader size="lg" />
          
          {message && (
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="mt-6 text-xs font-bold text-white/40 tracking-[0.3em] uppercase"
            >
              {message}
            </motion.p>
          )}

          {/* Decorative background elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full pointer-events-none opacity-50" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalLoadingOverlay;
