export const setupExitIntent = (onExitIntent: () => void) => {
  if (typeof window === 'undefined') return () => {};

  // Check if device is probably desktop
  const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
  if (!isDesktop) return () => {};

  const handleMouseOut = (e: MouseEvent) => {
    // e.clientY < 10 means the mouse is moving towards the top of the browser window (address bar)
    if (e.clientY < 10) {
      onExitIntent();
    }
  };

  document.addEventListener('mouseout', handleMouseOut);

  return () => {
    document.removeEventListener('mouseout', handleMouseOut);
  };
};
