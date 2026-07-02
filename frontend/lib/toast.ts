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

const getToastId = (message: string | React.ReactNode, data?: ExternalToast): string | number | undefined => {
  if (data?.id) return data.id;
  if (typeof message === "string") {
    return message;
  }
  return undefined;
};

const customToast = Object.assign(
  (message: string | React.ReactNode, data?: ExternalToast) => {
    const toastId = getToastId(message, data);
    const finalData = toastId ? { id: toastId, ...data } : data;
    const id = sonnerToast(message, finalData);
    manageQueue(id);
    return id;
  },
  sonnerToast, // Fallback for other methods like dismiss()
  {
    success: (message: string | React.ReactNode, data?: ExternalToast) => {
      const toastId = getToastId(message, data);
      const finalData = toastId ? { id: toastId, ...data } : data;
      const id = sonnerToast.success(message, finalData);
      manageQueue(id);
      return id;
    },
    error: (message: string | React.ReactNode, data?: ExternalToast) => {
      const toastId = getToastId(message, data);
      const finalData = toastId ? { id: toastId, ...data } : data;
      const id = sonnerToast.error(message, finalData);
      manageQueue(id);
      return id;
    },
    warning: (message: string | React.ReactNode, data?: ExternalToast) => {
      const toastId = getToastId(message, data);
      const finalData = toastId ? { id: toastId, ...data } : data;
      const id = sonnerToast.warning(message, finalData);
      manageQueue(id);
      return id;
    },
    info: (message: string | React.ReactNode, data?: ExternalToast) => {
      const toastId = getToastId(message, data);
      const finalData = toastId ? { id: toastId, ...data } : data;
      const id = sonnerToast.info(message, finalData);
      manageQueue(id);
      return id;
    }
  }
);

export const toast = customToast;
