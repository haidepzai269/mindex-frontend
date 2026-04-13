import { create } from 'zustand';

interface ConfirmButtonOptions {
  label?: string;
  className?: string;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  hideCancel?: boolean;
}

interface ConfirmStore {
  isOpen: boolean;
  options: ConfirmOptions | null;
  isLoading: boolean;
  confirm: (options: ConfirmOptions) => void;
  close: () => void;
  setLoading: (loading: boolean) => void;
}

export const useConfirmStore = create<ConfirmStore>((set) => ({
  isOpen: false,
  options: null,
  isLoading: false,
  confirm: (options) => set({ isOpen: true, options, isLoading: false }),
  close: () => set({ isOpen: false, options: null, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
