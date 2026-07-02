"use client";

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        #nprogress .bar {
          z-index: 99999 !important;
        }
      `}</style>
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
