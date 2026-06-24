"use client";

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ProgressBar
        height="4px"
        color="#ff5722" // Màu cam chủ đạo của LazPe
        options={{ showSpinner: false }}
        shallowRouting
      />
    </>
  );
}
