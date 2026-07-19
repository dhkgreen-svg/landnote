import { create } from 'zustand';

interface RegisterStore {
  email: string;
  password: string;
  password_confirm: string;
  agent_name: string;
  phone: string;
  license_number: string;
  office_name: string;
  selected_plan: 'minimal' | 'standard' | 'pro' | null;
  setField: <K extends keyof Omit<RegisterStore, 'setField' | 'reset'>>(
    key: K, value: RegisterStore[K]
  ) => void;
  reset: () => void;
}

export const useRegisterStore = create<RegisterStore>((set) => ({
  email: '', password: '', password_confirm: '', agent_name: '', phone: '',
  license_number: '', office_name: '', selected_plan: null,
  setField: (key, value) => set({ [key]: value }),
  reset: () => set({
    email: '', password: '', password_confirm: '', agent_name: '', phone: '',
    license_number: '', office_name: '', selected_plan: null,
  }),
}));
