"use client";

import React, { useState, useEffect } from "react";
import QuickAddModal from "./QuickAddModal";

export default function QuickAddGlobal() {
  const [activeProductId, setActiveProductId] = useState<number | null>(null);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent;
      setActiveProductId(customEvent.detail.productId);
    };

    window.addEventListener("open_quick_add", handleOpen);
    return () => window.removeEventListener("open_quick_add", handleOpen);
  }, []);

  if (activeProductId === null) return null;

  return (
    <QuickAddModal 
      productId={activeProductId} 
      onClose={() => setActiveProductId(null)} 
    />
  );
}
