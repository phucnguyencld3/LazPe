import { toast as sonnerToast, ExternalToast } from "sonner";

const MAX_TOASTS = 3;
let toastQueue: (string | number)[] = [];

const manageQueue = (id: string | number) => {
  toastQueue.push(id);
  if (toastQueue.length > MAX_TOASTS) {
    const oldId = toastQueue.shift();
    if (oldId) sonnerToast.dismiss(oldId);
  }
};

const customToast = Object.assign(
  (message: string | React.ReactNode, data?: ExternalToast) => {
    const id = sonnerToast(message, data);
    manageQueue(id);
    return id;
  },
  sonnerToast, // Fallback for other methods like dismiss()
  {
    success: (message: string | React.ReactNode, data?: ExternalToast) => {
      const id = sonnerToast.success(message, data);
      manageQueue(id);
      return id;
    },
    error: (message: string | React.ReactNode, data?: ExternalToast) => {
      const id = sonnerToast.error(message, data);
      manageQueue(id);
      return id;
    },
    warning: (message: string | React.ReactNode, data?: ExternalToast) => {
      const id = sonnerToast.warning(message, data);
      manageQueue(id);
      return id;
    },
    info: (message: string | React.ReactNode, data?: ExternalToast) => {
      const id = sonnerToast.info(message, data);
      manageQueue(id);
      return id;
    }
  }
);

export const toast = customToast;
