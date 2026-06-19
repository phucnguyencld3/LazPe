"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down
  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 sm:bottom-24 sm:right-6 z-[40] w-12 h-12 flex items-center justify-center rounded-[16px] bg-slate-800 text-white shadow-lg hover:bg-primary hover:text-white hover:-translate-y-1 active:scale-95 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 group"
          aria-label="Cuộn lên đầu trang"
        >
          <ArrowUp size={24} className="group-hover:animate-bounce" />
        </button>
      )}
    </>
  );
}
