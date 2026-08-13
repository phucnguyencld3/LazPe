export const REMINDER_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

export const getStorageItem = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
};

export const setStorageItem = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
};

export const canShowReminder = (): boolean => {
  const lastShown = getStorageItem('cart_reminder_last_shown');
  if (!lastShown) return true;
  
  const lastShownTime = parseInt(lastShown, 10);
  if (isNaN(lastShownTime)) return true;

  return Date.now() - lastShownTime >= REMINDER_COOLDOWN_MS;
};

export const markReminderShown = (): void => {
  setStorageItem('cart_reminder_last_shown', Date.now().toString());
};

export const hasExitIntentTriggered = (): boolean => {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('cart_reminder_exit_intent') === 'true';
};

export const markExitIntentTriggered = (): void => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('cart_reminder_exit_intent', 'true');
};
