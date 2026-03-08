'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Plus,
  Trash2,
  Key,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Edit2,
  X,
  Loader2,
  Search,
  Sparkles,
  RefreshCw,
  Building2,
  Palette,
  Upload,
} from 'lucide-react';
import {
  useConfigStore,
  ApiProvider,
  ApiConfig,
  DEFAULT_BASE_URLS,
  DEFAULT_OCR_PROMPT,
  DEFAULT_DESCRIPTION_PROMPT,
  checkVisionCapability,
} from '@/lib/config-store';
import { useToast } from '@/hooks/use-toast';

interface OpenRouterModel {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  promptPrice: string;
  completionPrice: string;
  hasVision: boolean;
}

export function SettingsDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
          <Settings className="w-4 h-4 mr-2" />
          Configuración
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración
          </DialogTitle>
          <DialogDescription>
            Configura tus APIs de IA y la identidad de tu empresa.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="company" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="company">Empresa</TabsTrigger>
            <TabsTrigger value="apis">APIs</TabsTrigger>
            <TabsTrigger value="assignment">Asignación</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="company" className="m-0">
              <CompanySettings />
            </TabsContent>
            <TabsContent value="apis" className="m-0">
              <ApisTab />
            </TabsContent>
            <TabsContent value="assignment" className="m-0">
              <ModelAssignmentSection />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function CompanySettings() {
  const { company, updateCompany } = useConfigStore();
  const { toast } = useToast();

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) {
        toast({
          title: 'Error',
          description: 'El logo debe ser menor a 500KB',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        updateCompany({ logo: event.target?.result as string });
        toast({ title: 'Logo actualizado' });
      };
      reader.readAsDataURL(file);
    }
  }, [updateCompany, toast]);

  return (
    <div className="space-y-6">
      {/* Logo */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Logo de la Empresa
          </CardTitle>
          <CardDescription>
            Se mostrará en el encabezado de los informes
          </CardDescription>
        </CardHeader>
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-4">
            {company.logo ? (
              <div className="relative">
                <img
                  src={company.logo}
                  alt="Logo"
                  className="w-20 h-20 object-contain border rounded-lg p-2"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0"
                  onClick={() => updateCompany({ logo: null })}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                <Building2 className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button variant="outline" className="cursor-pointer" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Logo
                </span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Colores
          </CardTitle>
          <CardDescription>
            Personaliza los colores del informe
          </CardDescription>
        </CardHeader>
        <CardContent className="py-3 px-4 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nombre de Empresa</Label>
              <Input
                value={company.name}
                onChange={(e) => updateCompany({ name: e.target.value })}
                placeholder="PAQUIURCISNER"
              />
            </div>
            <div className="space-y-2">
              <Label>Color Principal</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={company.primaryColor}
                  onChange={(e) => updateCompany({ primaryColor: e.target.value })}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={company.primaryColor}
                  onChange={(e) => updateCompany({ primaryColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color Secundario</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={company.secondaryColor}
                  onChange={(e) => updateCompany({ secondaryColor: e.target.value })}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={company.secondaryColor}
                  onChange={(e) => updateCompany({ secondaryColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 p-4 rounded-lg border">
            <p className="text-xs text-muted-foreground mb-2">Vista previa:</p>
            <div
              className="p-4 rounded-lg text-white"
              style={{ background: `linear-gradient(135deg, ${company.primaryColor} 0%, ${company.secondaryColor} 100%)` }}
            >
              <div className="flex items-center gap-3">
                {company.logo ? (
                  <img src={company.logo} alt="Logo" className="w-10 h-10 object-contain bg-white rounded p-1" />
                ) : (
                  <div className="w-10 h-10 bg-white/20 rounded flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <p className="font-bold">{company.name}</p>
                  <p className="text-xs text-white/70">Estructuras Metálicas</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ApisTab() {
  return (
    <Tabs defaultValue="list">
      <TabsList className="mb-4">
        <TabsTrigger value="list">APIs Configuradas</TabsTrigger>
        <TabsTrigger value="add">Agregar API</TabsTrigger>
      </TabsList>
      <TabsContent value="list">
        <ApiListSection />
      </TabsContent>
      <TabsContent value="add">
        <AddApiSection />
      </TabsContent>
    </Tabs>
  );
}

function ApiListSection() {
  const { apis, removeApi, setActiveApi } = useConfigStore();
  const [editingApi, setEditingApi] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const { toast } = useToast();

  if (apis.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Key className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">No hay APIs configuradas</p>
        <p className="text-sm mt-1">Ve a la pestaña "Agregar API" para comenzar</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {apis.map((api) => (
        <ApiCard
          key={api.id}
          api={api}
          isEditing={editingApi === api.id}
          showApiKey={showApiKey === api.id}
          onEdit={() => setEditingApi(editingApi === api.id ? null : api.id)}
          onToggleKey={() => setShowApiKey(showApiKey === api.id ? null : api.id)}
          onDelete={() => {
            removeApi(api.id);
            toast({ title: 'API eliminada' });
          }}
          onSetActive={() => {
            setActiveApi(api.id);
            toast({ title: 'API establecida como activa' });
          }}
          onSaveEdit={(updates) => {
            useConfigStore.getState().updateApi(api.id, updates);
            setEditingApi(null);
            toast({ title: 'API actualizada' });
          }}
          onCancelEdit={() => setEditingApi(null)}
        />
      ))}
    </div>
  );
}

interface ApiCardProps {
  api: ApiConfig;
  isEditing: boolean;
  showApiKey: boolean;
  onEdit: () => void;
  onToggleKey: () => void;
  onDelete: () => void;
  onSetActive: () => void;
  onSaveEdit: (updates: Partial<ApiConfig>) => void;
  onCancelEdit: () => void;
}

function ApiCard({ api, isEditing, showApiKey, onEdit, onToggleKey, onDelete, onSetActive, onSaveEdit, onCancelEdit }: ApiCardProps) {
  const [editForm, setEditForm] = useState({
    name: api.name,
    model: api.model,
    baseUrl: api.baseUrl || '',
    ocrSystemPrompt: api.ocrSystemPrompt,
    descriptionSystemPrompt: api.descriptionSystemPrompt,
  });

  if (isEditing) {
    return (
      <Card className="border-primary">
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Editando: {api.name}</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onCancelEdit}>
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
              <Button size="sm" onClick={() => onSaveEdit(editForm)}>
                <Check className="w-4 h-4 mr-1" />
                Guardar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-3 px-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Input
                value={editForm.model}
                onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
              />
            </div>
          </div>

          {api.provider === 'custom' && (
            <div className="space-y-2">
              <Label>Base URL</Label>
              <Input
                value={editForm.baseUrl}
                onChange={(e) => setEditForm({ ...editForm, baseUrl: e.target.value })}
              />
            </div>
          )}

          <CollapsiblePrompt
            title="System Prompt OCR"
            value={editForm.ocrSystemPrompt}
            onChange={(v) => setEditForm({ ...editForm, ocrSystemPrompt: v })}
            onReset={() => setEditForm({ ...editForm, ocrSystemPrompt: DEFAULT_OCR_PROMPT })}
          />

          <CollapsiblePrompt
            title="System Prompt Descripciones"
            value={editForm.descriptionSystemPrompt}
            onChange={(v) => setEditForm({ ...editForm, descriptionSystemPrompt: v })}
            onReset={() => setEditForm({ ...editForm, descriptionSystemPrompt: DEFAULT_DESCRIPTION_PROMPT })}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${api.isActive ? 'border-primary' : ''}`}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm">{api.name}</CardTitle>
            <Badge variant={api.isActive ? 'default' : 'secondary'}>
              {api.provider}
            </Badge>
            {api.hasVision && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Eye className="w-3 h-3 mr-1" />
                Vision
              </Badge>
            )}
            {api.isActive && (
              <Badge variant="outline" className="text-primary border-primary">
                <Check className="w-3 h-3 mr-1" />
                Activa
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onToggleKey}>
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs mt-1">
          Modelo: {api.model}
        </CardDescription>
      </CardHeader>
      <CardContent className="py-2 px-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Key className="w-3 h-3" />
          <code className="bg-muted px-2 py-0.5 rounded flex-1 overflow-hidden text-ellipsis">
            {showApiKey ? api.apiKey : `${api.apiKey.substring(0, 8)}${'•'.repeat(20)}`}
          </code>
        </div>
        {!api.isActive && (
          <Button variant="outline" size="sm" className="mt-2" onClick={onSetActive}>
            Establecer como activa
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function CollapsiblePrompt({
  title,
  value,
  onChange,
  onReset,
}: {
  title: string;
  value: string;
  onChange: (v: string) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50"
      >
        <div className="font-medium text-sm">{title}</div>
        <Badge variant="outline" className="text-xs">
          {open ? 'Ocultar' : 'Editar'}
        </Badge>
      </button>
      {open && (
        <div className="p-3 pt-0">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={6}
            className="font-mono text-xs"
          />
          <Button variant="ghost" size="sm" className="mt-2" onClick={onReset}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Restaurar default
          </Button>
        </div>
      )}
    </div>
  );
}

function AddApiSection() {
  const { addApi } = useConfigStore();
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState('');
  const [provider, setProvider] = useState<ApiProvider>('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URLS['openrouter']);
  const [model, setModel] = useState('');
  const [ocrPrompt, setOcrPrompt] = useState(DEFAULT_OCR_PROMPT);
  const [descriptionPrompt, setDescriptionPrompt] = useState(DEFAULT_DESCRIPTION_PROMPT);

  // OpenRouter models
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [modelError, setModelError] = useState<string | null>(null);

  // Fetch OpenRouter models when API key changes
  const fetchOpenRouterModels = useCallback(async (key: string) => {
    if (provider !== 'openrouter' || !key) return;

    setIsLoadingModels(true);
    setModelError(null);

    try {
      const response = await fetch('/api/openrouter-models', {
        headers: {
          'X-API-Key': key,
        },
      });

      const data = await response.json();

      if (data.success) {
        setOpenRouterModels(data.models);
      } else {
        setModelError(data.error || 'Error al obtener modelos');
      }
    } catch (err) {
      setModelError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setIsLoadingModels(false);
    }
  }, [provider]);

  // Debounced fetch
  useEffect(() => {
    if (provider === 'openrouter' && apiKey.length > 10) {
      const timer = setTimeout(() => fetchOpenRouterModels(apiKey), 500);
      return () => clearTimeout(timer);
    }
  }, [apiKey, provider, fetchOpenRouterModels]);

  const handleProviderChange = (newProvider: ApiProvider) => {
    setProvider(newProvider);
    setBaseUrl(DEFAULT_BASE_URLS[newProvider]);
    setModel('');
    setOpenRouterModels([]);
    setModelError(null);
  };

  const filteredModels = useMemo(() => {
    if (!modelSearch) return openRouterModels;
    const search = modelSearch.toLowerCase();
    return openRouterModels.filter(m =>
      m.id.toLowerCase().includes(search) ||
      m.name.toLowerCase().includes(search) ||
      m.provider.toLowerCase().includes(search)
    );
  }, [openRouterModels, modelSearch]);

  const handleAddApi = useCallback(() => {
    if (!name.trim() || !apiKey.trim() || !model.trim()) {
      toast({
        title: 'Error',
        description: 'Nombre, API Key y Modelo son requeridos',
        variant: 'destructive',
      });
      return;
    }

    const hasVision = checkVisionCapability(model);

    addApi({
      name: name.trim(),
      provider,
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || DEFAULT_BASE_URLS[provider],
      model: model.trim(),
      isActive: false,
      ocrSystemPrompt: ocrPrompt,
      descriptionSystemPrompt: descriptionPrompt,
      hasVision,
    });

    // Reset form
    setName('');
    setApiKey('');
    setModel('');
    setOpenRouterModels([]);
    setOcrPrompt(DEFAULT_OCR_PROMPT);
    setDescriptionPrompt(DEFAULT_DESCRIPTION_PROMPT);

    toast({
      title: 'API agregada',
      description: 'La API ha sido configurada exitosamente',
    });
  }, [name, provider, apiKey, baseUrl, model, ocrPrompt, descriptionPrompt, addApi, toast]);

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div className="grid grid-cols-4 gap-2">
        {(['openrouter', 'openai', 'anthropic', 'custom'] as ApiProvider[]).map((p) => (
          <Button
            key={p}
            variant={provider === p ? 'default' : 'outline'}
            className="justify-start"
            onClick={() => handleProviderChange(p)}
          >
            {p === 'openrouter' && '🔗 OpenRouter'}
            {p === 'openai' && '🤖 OpenAI'}
            {p === 'anthropic' && '🧠 Anthropic'}
            {p === 'custom' && '⚙️ Custom'}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nombre *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mi API de OpenRouter"
          />
        </div>

        <div className="space-y-2">
          <Label>API Key *</Label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={provider === 'openrouter' ? 'sk-or-v1-...' : 'sk-...'}
          />
        </div>
      </div>

      {/* OpenRouter Model Selector - Shows ALL models */}
      {provider === 'openrouter' && apiKey.length > 10 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Seleccionar Modelo (todos disponibles)</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchOpenRouterModels(apiKey)}
              disabled={isLoadingModels}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoadingModels ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>

          {isLoadingModels ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Cargando modelos...</span>
            </div>
          ) : modelError ? (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span>{modelError}</span>
            </div>
          ) : openRouterModels.length > 0 ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  placeholder="Buscar modelo..."
                  className="pl-10"
                />
              </div>

              {model && (
                <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Seleccionado: {model}</span>
                </div>
              )}

              <div className="max-h-[300px] overflow-y-auto border rounded-lg">
                {filteredModels.slice(0, 100).map((m) => (
                  <ModelItem
                    key={m.id}
                    model={m}
                    isSelected={model === m.id}
                    onSelect={() => setModel(m.id)}
                  />
                ))}
                {filteredModels.length > 100 && (
                  <div className="p-2 text-center text-xs text-muted-foreground bg-muted">
                    Mostrando 100 de {filteredModels.length} modelos. Usa el buscador para filtrar.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Manual Model Input */}
      {(provider !== 'openrouter' || openRouterModels.length === 0) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Modelo *</Label>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o, claude-3-5-sonnet-20241022..."
            />
          </div>

          {provider === 'custom' && (
            <div className="space-y-2">
              <Label>Base URL *</Label>
              <Input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
              />
            </div>
          )}
        </div>
      )}

      {/* Custom Prompts */}
      <CollapsiblePrompt
        title="System Prompt OCR"
        value={ocrPrompt}
        onChange={setOcrPrompt}
        onReset={() => setOcrPrompt(DEFAULT_OCR_PROMPT)}
      />

      <CollapsiblePrompt
        title="System Prompt Descripciones"
        value={descriptionPrompt}
        onChange={setDescriptionPrompt}
        onReset={() => setDescriptionPrompt(DEFAULT_DESCRIPTION_PROMPT)}
      />

      <Button onClick={handleAddApi} className="w-full" disabled={!name || !apiKey || !model}>
        <Plus className="w-4 h-4 mr-2" />
        Agregar API
      </Button>
    </div>
  );
}

interface ModelItemProps {
  model: OpenRouterModel;
  isSelected: boolean;
  onSelect: () => void;
}

function ModelItem({ model, isSelected, onSelect }: ModelItemProps) {
  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    if (num === 0) return 'Gratis';
    if (num < 0.001) return `$${num.toFixed(6)}`;
    return `$${num.toFixed(4)}`;
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors border-b last:border-b-0 ${
        isSelected ? 'bg-primary/10' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-mono text-xs truncate">{model.id}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
            <span>{model.provider}</span>
            {model.hasVision && (
              <Badge variant="outline" className="text-[10px] py-0">Vision</Badge>
            )}
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {formatPrice(model.promptPrice)}/1K
        </div>
      </div>
    </button>
  );
}

function ModelAssignmentSection() {
  const {
    apis,
    ocrApiId,
    descriptionApiId,
    setOcrApiId,
    setDescriptionApiId,
  } = useConfigStore();

  // For OCR, show ALL APIs (user can choose any model)
  // Mark vision-capable ones for recommendation
  const visionApis = apis.filter((api) => api.hasVision);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="w-4 h-4" />
            OCR (Lectura de Imágenes)
          </CardTitle>
          <CardDescription>
            Se recomienda usar modelos con capacidad de visión para OCR.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-2 px-4 space-y-3">
          <Select
            value={ocrApiId || 'default'}
            onValueChange={(v) => setOcrApiId(v === 'default' ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Usar Z.ai (por defecto)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Usar Z.ai (por defecto)</SelectItem>
              {apis.map((api) => (
                <SelectItem key={api.id} value={api.id}>
                  {api.name} ({api.model}) {!api.hasVision && '⚠️'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {apis.length > 0 && visionApis.length === 0 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-800 dark:text-amber-200 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Recomendación</p>
                <p>Para mejor resultado en OCR, usa modelos con visión como GPT-4o, Claude 3.5 Sonnet, o Gemini Pro.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Generación de Descripciones
          </CardTitle>
          <CardDescription>
            Cualquier modelo puede generar descripciones de texto.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-2 px-4">
          <Select
            value={descriptionApiId || 'default'}
            onValueChange={(v) => setDescriptionApiId(v === 'default' ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Usar Z.ai (por defecto)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Usar Z.ai (por defecto)</SelectItem>
              {apis.map((api) => (
                <SelectItem key={api.id} value={api.id}>
                  {api.name} ({api.model})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}
