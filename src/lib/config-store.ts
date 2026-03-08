import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ApiProvider = 'openrouter' | 'openai' | 'anthropic' | 'custom';

export interface ApiConfig {
  id: string;
  name: string;
  provider: ApiProvider;
  apiKey: string;
  baseUrl?: string;
  model: string;
  isActive: boolean;
  // Custom prompts
  ocrSystemPrompt: string;
  descriptionSystemPrompt: string;
  // Capabilities
  hasVision: boolean;
  contextLength?: number;
}

export interface CompanyConfig {
  name: string;
  logo: string | null; // base64
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
}

export interface AppConfigState {
  // API Configuration
  apis: ApiConfig[];

  // OCR Settings
  ocrApiId: string | null;

  // Description Generation Settings
  descriptionApiId: string | null;

  // Company Configuration
  company: CompanyConfig;

  // Actions
  addApi: (api: Omit<ApiConfig, 'id'>) => string;
  updateApi: (id: string, updates: Partial<ApiConfig>) => void;
  removeApi: (id: string) => void;
  setActiveApi: (id: string) => void;

  setOcrApiId: (id: string | null) => void;
  setDescriptionApiId: (id: string | null) => void;

  // Company actions
  updateCompany: (updates: Partial<CompanyConfig>) => void;

  // Get API configs
  getActiveApi: () => ApiConfig | null;
  getOcrApi: () => ApiConfig | null;
  getDescriptionApi: () => ApiConfig | null;
  getApiById: (id: string) => ApiConfig | null;

  // Reset
  reset: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

// Default system prompts
export const DEFAULT_OCR_PROMPT = `You are an expert OCR system specialized in extracting data from Excel spreadsheet images for construction reports.

Extract ALL data from the table. Return ONLY a JSON object (no markdown, no code blocks):
{
  "period": "extracted period string",
  "totalAmount": total numeric value,
  "rows": [
    {
      "proyecto": "project code",
      "descripcion": "description text (this will be used as title)",
      "costoActual": number
    }
  ]
}

Important:
- Extract ALL rows from the table
- Convert all numeric values to numbers
- If a cell is empty, use empty string for text or 0 for numbers
- Return ONLY valid JSON, no additional text`;

export const DEFAULT_DESCRIPTION_PROMPT = `Eres un ingeniero civil experto en estructuras metálicas.

Genera descripciones técnicas profesionales para informes de avance de obra. Las descripciones deben:
- Ser técnicas y profesionales
- Incluir detalles relevantes sobre el trabajo realizado
- Ser concisas pero informativas (máximo 2-3 oraciones)
- Estar escritas en español técnico de construcción

Responde ÚNICAMENTE con la descripción técnica mejorada.`;

export const DEFAULT_DESCRIPTION_BATCH_PROMPT = `Eres un ingeniero civil experto en estructuras metálicas.

Genera descripciones técnicas profesionales para informes de avance de obra. Las descripciones deben:
- Ser técnicas y profesionales
- Incluir detalles relevantes sobre el trabajo realizado
- Ser concisas pero informativas (máximo 2-3 oraciones)
- Estar escritas en español técnico de construcción

Recibirás una lista de items con su código y título. Debes generar una descripción para CADA uno.
Responde ÚNICAMENTE con un JSON array donde cada elemento tiene "codigo" y "descripcion":
[
  {"codigo": "P001", "descripcion": "descripción generada"},
  {"codigo": "P002", "descripcion": "descripción generada"}
]`;

// Default base URLs for each provider
export const DEFAULT_BASE_URLS: Record<ApiProvider, string> = {
  'openrouter': 'https://openrouter.ai/api/v1',
  'openai': 'https://api.openai.com/v1',
  'anthropic': 'https://api.anthropic.com/v1',
  'custom': '',
};

// Known vision-capable model patterns
export const VISION_MODEL_PATTERNS = [
  'vision',
  'gpt-4o',
  'gpt-4-turbo',
  'gpt-4-vision',
  'claude-3',
  'gemini',
  'llava',
  'qwen-vl',
  'cogvlm',
  'idefics',
  'pixtral',
  'llama-3.2-11b',
  'llama-3.2-90b',
];

export function checkVisionCapability(model: string): boolean {
  const modelLower = model.toLowerCase();
  return VISION_MODEL_PATTERNS.some(pattern => modelLower.includes(pattern));
}

const initialState = {
  apis: [],
  ocrApiId: null,
  descriptionApiId: null,
  company: {
    name: 'PAQUIURCISNER',
    logo: null,
    primaryColor: '#1e3a5f',
    secondaryColor: '#2563eb',
    textColor: '#1a1a1a',
  },
};

export const useConfigStore = create<AppConfigState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addApi: (api) => {
        const id = generateId();
        set((state) => ({
          apis: [...state.apis, { ...api, id }],
        }));
        return id;
      },

      updateApi: (id, updates) =>
        set((state) => ({
          apis: state.apis.map((api) =>
            api.id === id ? { ...api, ...updates } : api
          ),
        })),

      removeApi: (id) =>
        set((state) => ({
          apis: state.apis.filter((api) => api.id !== id),
          ocrApiId: state.ocrApiId === id ? null : state.ocrApiId,
          descriptionApiId: state.descriptionApiId === id ? null : state.descriptionApiId,
        })),

      setActiveApi: (id) =>
        set((state) => ({
          apis: state.apis.map((api) => ({
            ...api,
            isActive: api.id === id,
          })),
        })),

      setOcrApiId: (ocrApiId) => set({ ocrApiId }),
      setDescriptionApiId: (descriptionApiId) => set({ descriptionApiId }),

      updateCompany: (updates) =>
        set((state) => ({
          company: { ...state.company, ...updates },
        })),

      getActiveApi: () => {
        const state = get();
        return state.apis.find((api) => api.isActive) || null;
      },

      getOcrApi: () => {
        const state = get();
        if (!state.ocrApiId) return null;
        return state.apis.find((api) => api.id === state.ocrApiId) || null;
      },

      getDescriptionApi: () => {
        const state = get();
        if (!state.descriptionApiId) return null;
        return state.apis.find((api) => api.id === state.descriptionApiId) || null;
      },

      getApiById: (id) => {
        const state = get();
        return state.apis.find((api) => api.id === id) || null;
      },

      reset: () => set(initialState),
    }),
    {
      name: 'app-config-storage',
      skipHydration: true,
    }
  )
);

// CSV Format documentation
export const CSV_FORMAT_INFO = `
FORMATO CSV REQUERIDO:
======================
El archivo CSV debe tener las siguientes columnas (en cualquier orden):

Columnas obligatorias:
- codigo (o proyecto): Código del proyecto (ej: P2219-OBRA)
- descripcion (o titulo): Título/descripción del trabajo realizado

Columnas opcionales:
- costo: Costo actual del item

Ejemplo:
codigo,descripcion,costo
P2219-OBRA,Instalación de estructura metálica,1500.00
P2242-FLUOR,Montaje de truss,800.50
P2243-CUAJONE,Fabricación de soportes,1200.00

Notas:
- La primera fila debe ser el encabezado
- Los valores decimales usan punto (.)
- El encoding debe ser UTF-8
`;
