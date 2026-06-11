"use client";

import React from "react";
import { X } from "lucide-react";

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: { url: string; mediaType: string } | null;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  onClose,
  media,
}) => {
  if (!isOpen || !media) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative max-w-3xl w-full max-h-[85vh] bg-slate-900 rounded-[2rem] overflow-hidden flex flex-col justify-center items-center shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 z-10 cursor-pointer"
        >
          <X size={16} />
        </button>
        <div className="w-full flex justify-center items-center p-6 min-h-[300px]">
          {media.mediaType === "VIDEO" ? (
            <video
              src={media.url}
              controls
              autoPlay
              className="max-w-full max-h-[70vh] rounded-2xl shadow-inner"
            />
          ) : (
            <img
              src={media.url}
              alt="Full preview"
              className="max-w-full max-h-[70vh] object-contain rounded-2xl"
            />
          )}
        </div>
      </div>
    </div>
  );
};
