import { create } from 'zustand';
import type { CategoryCode, TransactionType } from '@landnote/shared';

interface FormStore {
  step: 1 | 2 | 3 | 4;
  agentCode: string;
  inquiry_type: 'looking_for' | 'listing' | null;
  category_codes: CategoryCode[];
  subcategory_codes: string[];
  tags: string[];
  transaction_types: TransactionType[];
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  complex_name: string;
  building_num: string;
  room_num: string;
  area_land: string;
  area_building: string;
  area_contract: string;
  detailed_conditions: Record<string, unknown>;
  images: { dataUrl: string; mimeType: string; fileName: string }[];

  setInquiryType: (t: FormStore['inquiry_type']) => void;
  toggleCategory: (code: CategoryCode, maxSelectable?: number) => void;
  toggleSubcategory: (code: string) => void;
  toggleTag: (tag: string, allowMultiple?: boolean) => void;
  setCondition: (key: string, value: unknown) => void;
  setStoreValue: <K extends keyof FormStore>(key: K, value: FormStore[K]) => void;
  addImage: (dataUrl: string, mimeType: string, fileName: string) => void;
  removeImage: (index: number) => void;
  reset: () => void;
}

export const useFormStore = create<FormStore>((set, get) => ({
  step: 1, agentCode: '', inquiry_type: null,
  category_codes: [], subcategory_codes: [], tags: [],
  transaction_types: [], customer_name: '', customer_phone: '',
  customer_email: '', complex_name: '', building_num: '', room_num: '',
  area_land: '', area_building: '', area_contract: '',
  detailed_conditions: {}, images: [],

  setInquiryType: (t) => set({ inquiry_type: t }),

  toggleCategory: (code, max = 1) => {
    const prev = get().category_codes;
    let next: CategoryCode[];
    if (prev.includes(code)) {
      next = prev.filter(c => c !== code);
    } else if (max === 1) {
      next = [code];
    } else if (prev.length < max) {
      next = [...prev, code];
    } else {
      next = prev;
    }

    set({ category_codes: next });

    if (!next.includes('commercial')) {
      const currentTx = get().transaction_types;
      if (currentTx.includes('premium_transfer')) {
        set({ transaction_types: currentTx.filter(t => t !== 'premium_transfer') });
      }
    }
  },

  toggleSubcategory: (code) => {
    const prev = get().subcategory_codes;
    if (prev.includes(code)) {
      set({ subcategory_codes: prev.filter(c => c !== code) });
    } else {
      set({ subcategory_codes: [...prev, code] });
    }
  },

  toggleTag: (tag, allowMultiple = false) => {
    const prev = get().tags;
    if (prev.includes(tag)) {
      set({ tags: prev.filter(t => t !== tag) });
    } else {
      set({ tags: allowMultiple ? [...prev, tag] : [tag] });
    }
  },

  setCondition: (key, value) =>
    set(s => ({ detailed_conditions: { ...s.detailed_conditions, [key]: value } })),

  setStoreValue: (key, value) => set({ [key]: value } as any),

  addImage: (dataUrl, mimeType, fileName) =>
    set(s => ({ images: [...s.images, { dataUrl, mimeType, fileName }] })),

  removeImage: (index) =>
    set(s => ({ images: s.images.filter((_, i) => i !== index) })),

  reset: () => set({
    step: 1, inquiry_type: null, category_codes: [], subcategory_codes: [],
    tags: [], transaction_types: [], customer_name: '', customer_phone: '',
    customer_email: '', complex_name: '', building_num: '', room_num: '',
    area_land: '', area_building: '',
    detailed_conditions: {}, images: [],
  }),
}));
