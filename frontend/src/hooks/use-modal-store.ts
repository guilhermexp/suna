import { create } from 'zustand';

interface ModalStore {
  isOpen: boolean;
  type: string | null;
  data: any;
  onOpen: (type: string, data?: any) => void;
  onClose: () => void;
  openModal: (type: string, data?: any) => void;
  closeModal: () => void;
}

export const useModal = create<ModalStore>((set) => ({
  isOpen: false,
  type: null,
  data: null,
  onOpen: (type, data = null) => set({ isOpen: true, type, data }),
  onClose: () => set({ isOpen: false, type: null, data: null }),
  openModal: (type, data = null) => set({ isOpen: true, type, data }),
  closeModal: () => set({ isOpen: false, type: null, data: null }),
}));