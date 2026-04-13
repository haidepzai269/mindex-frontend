"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConfirmStore } from "@/store/useConfirmStore";
import { Loader2, AlertCircle } from "lucide-react";

export const PremiumConfirmDialog: React.FC = () => {
  const { isOpen, options, isLoading, close, setLoading } = useConfirmStore();

  if (!isOpen || !options) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await options.onConfirm();
      close();
    } catch (error) {
      console.error("Confirm dialog error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (options.onCancel) options.onCancel();
    close();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
          {/* Backdrop with extreme blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Dialog Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[#0D0D12] border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden"
          >
            {/* Subtle Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                    <AlertCircle size={24} />
                 </div>
                 <h3 className="text-xl font-bold text-white tracking-tight">
                   {options.title}
                 </h3>
              </div>

              <p className="text-zinc-400 text-sm leading-relaxed mb-10 font-medium">
                {options.message}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all border border-white/5 active:scale-95 disabled:opacity-50"
                >
                  {options.cancelLabel || "Hủy"}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-1 h-12 rounded-2xl bg-white text-black font-extrabold text-sm transition-all hover:bg-zinc-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 size={16} className="animate-spin" />}
                  {options.confirmLabel || "Xác nhận"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
