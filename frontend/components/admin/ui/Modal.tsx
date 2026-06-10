"use client";
import React, { useRef, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  isFullscreen?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
  showCloseButton = true,
  isFullscreen = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const contentClasses = isFullscreen
    ? "w-full h-full"
    : "relative w-full max-w-lg rounded-3xl bg-white dark:bg-gray-900 border border-slate-100 dark:border-slate-800 shadow-2xl p-6 transition-all transform scale-100";

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto z-99999 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 h-full w-full bg-gray-500/30 dark:bg-gray-950/50 backdrop-blur-[8px] transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Content container */}
      <div
        ref={modalRef}
        className={`${contentClasses} ${className} z-50`}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-999 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
