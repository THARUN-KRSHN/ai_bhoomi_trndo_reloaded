"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  categoryTag?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  categoryTag,
  children,
  footer,
}: DrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#111211]/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-xl bg-[#FFFFFF] border-l border-[#E4E6E1] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-6 sm:p-7 border-b border-[#F0F2EE]">
            <div className="flex items-center justify-between gap-4 mb-2">
              {categoryTag && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E3FAEC] text-[#0C3D2D]">
                  {categoryTag}
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#F4F4F1] hover:bg-[#E4E6E1] flex items-center justify-center text-[#111211] transition-colors ml-auto"
                aria-label="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111211]">
              {title}
            </h3>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-7 flex-1 overflow-y-auto space-y-6 text-sm text-[#111211]">
            {children}
          </div>

          {/* Footer */}
          <div className="p-5 sm:p-6 border-t border-[#F0F2EE] bg-[#FAFBF9] flex items-center justify-end space-x-3">
            {footer || (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full bg-[#111211] text-white text-xs font-semibold hover:bg-[#252825] transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
