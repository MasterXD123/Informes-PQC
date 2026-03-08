import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ImageItem {
  id: string;
  file: string; // base64 or URL
  note: string;
  displayMode: 'original' | 'autoadjust';
  includeInPdf: boolean;
  rotation: number;
  brightness: number;
  contrast: number;
  assignedDate?: string; // Fecha asignada (pendiente de renderizar)
  renderedDate?: string; // Fecha renderizada en la imagen
  originalFile?: string; // Archivo original sin fecha (para resetear)
}

export interface ReportItem {
  id: string;
  codigo: string; // Código del proyecto
  titulo: string; // Título del item
  fabricacion: string; // Descripción original de fabricación (para generar descripción IA)
  descripcion: string; // Descripción corta generada por IA o manual
  isActive: boolean;
  images: ImageItem[];
}

export interface ReportState {
  // Report metadata
  period: string;
  client: string;
  title: string;
  subtitle: string;
  
  // Data
  items: ReportItem[];
  
  // UI State
  currentStep: number;
  selectedItemIndex: number | null;
  isLoading: boolean;
  isOcrProcessing: boolean;
  
  // Actions
  setPeriod: (period: string) => void;
  setClient: (client: string) => void;
  setTitle: (title: string) => void;
  setSubtitle: (subtitle: string) => void;
  setItems: (items: ReportItem[]) => void;
  setCurrentStep: (step: number) => void;
  setSelectedItemIndex: (index: number | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsOcrProcessing: (processing: boolean) => void;
  
  // Item actions
  updateItem: (index: number, updates: Partial<ReportItem>) => void;
  toggleItemActive: (index: number) => void;
  reorderItems: (oldIndex: number, newIndex: number) => void;
  addItemImage: (itemIndex: number, image: ImageItem) => void;
  updateItemImage: (itemIndex: number, imageIndex: number, updates: Partial<ImageItem>) => void;
  removeItemImage: (itemIndex: number, imageIndex: number) => void;
  reorderItemImages: (itemIndex: number, oldIndex: number, newIndex: number) => void;
  
  // Batch AI descriptions
  setMultipleDescriptions: (descriptions: { index: number; descripcion: string }[]) => void;
  
  // Reset
  reset: () => void;
}

// Helper function to generate unique IDs
export const generateId = () => Math.random().toString(36).substring(2, 11);

const initialState = {
  period: '',
  client: 'Haug S.A.',
  title: 'INFORME DE AVANCE DE OBRA',
  subtitle: '',
  items: [],
  currentStep: 0,
  selectedItemIndex: null,
  isLoading: false,
  isOcrProcessing: false,
};

// Custom storage with error handling for quota exceeded
const customStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      // Quota exceeded
      console.warn('Storage quota exceeded, trying to free space...');
      
      // Try to clear old data and retry
      try {
        // Clear other storage keys to make room
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key !== name && key.startsWith('report-')) {
            localStorage.removeItem(key);
          }
        });
        localStorage.setItem(name, value);
      } catch {
        console.error('Could not save state - storage full');
      }
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // Ignore
    }
  },
}));

export const useReportStore = create<ReportState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setPeriod: (period) => set({ period }),
      setClient: (client) => set({ client }),
      setTitle: (title) => set({ title }),
      setSubtitle: (subtitle) => set({ subtitle }),
      setItems: (items) => set({ items }),
      setCurrentStep: (currentStep) => set({ currentStep }),
      setSelectedItemIndex: (selectedItemIndex) => set({ selectedItemIndex }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setIsOcrProcessing: (isOcrProcessing) => set({ isOcrProcessing }),
      
      updateItem: (index, updates) =>
        set((state) => ({
          items: state.items.map((item, i) =>
            i === index ? { ...item, ...updates } : item
          ),
        })),
      
      toggleItemActive: (index) =>
        set((state) => ({
          items: state.items.map((item, i) =>
            i === index ? { ...item, isActive: !item.isActive } : item
          ),
        })),
      
      reorderItems: (oldIndex, newIndex) =>
        set((state) => {
          const newItems = [...state.items];
          const [removed] = newItems.splice(oldIndex, 1);
          newItems.splice(newIndex, 0, removed);
          return { items: newItems };
        }),
      
      addItemImage: (itemIndex, image) =>
        set((state) => ({
          items: state.items.map((item, i) =>
            i === itemIndex
              ? { ...item, images: [...item.images, image] }
              : item
          ),
        })),
      
      updateItemImage: (itemIndex, imageIndex, updates) =>
        set((state) => ({
          items: state.items.map((item, i) =>
            i === itemIndex
              ? {
                  ...item,
                  images: item.images.map((img, j) =>
                    j === imageIndex ? { ...img, ...updates } : img
                  ),
                }
              : item
          ),
        })),
      
      removeItemImage: (itemIndex, imageIndex) =>
        set((state) => ({
          items: state.items.map((item, i) =>
            i === itemIndex
              ? {
                  ...item,
                  images: item.images.filter((_, j) => j !== imageIndex),
                }
              : item
          ),
        })),
      
      reorderItemImages: (itemIndex, oldIndex, newIndex) =>
        set((state) => ({
          items: state.items.map((item, i) => {
            if (i !== itemIndex) return item;
            const newImages = [...item.images];
            const [removed] = newImages.splice(oldIndex, 1);
            newImages.splice(newIndex, 0, removed);
            return { ...item, images: newImages };
          }),
        })),
      
      setMultipleDescriptions: (descriptions) =>
        set((state) => {
          const newItems = [...state.items];
          descriptions.forEach(({ index, descripcion }) => {
            if (newItems[index]) {
              newItems[index] = { ...newItems[index], descripcion };
            }
          });
          return { items: newItems };
        }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'report-storage',
      storage: customStorage,
      partialize: (state) => ({
        period: state.period,
        client: state.client,
        title: state.title,
        subtitle: state.subtitle,
        items: state.items,
      }),
      skipHydration: true,
    }
  )
);
