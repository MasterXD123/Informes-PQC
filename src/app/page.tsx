'use client';

import { useState, useCallback } from 'react';
import {
  Upload,
  Table2,
  Image as ImageIcon,
  FileText,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  Building2,
  Sparkles,
  RotateCcw,
  Construction
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useReportStore } from '@/lib/store';
import { ImageUploader } from '@/components/report/ImageUploader';
import { DataTable } from '@/components/report/DataTable';
import { ImageManager } from '@/components/report/ImageManager';
import { PreviewPanel } from '@/components/report/PreviewPanel';
import { ExportButtons } from '@/components/report/ExportButtons';
import { SettingsDialog } from '@/components/report/SettingsDialog';
import { GlobalDateRenderer } from '@/components/report/GlobalDateRenderer';
import { Toaster } from '@/components/ui/toaster';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const STEPS = [
  { id: 0, title: 'Cargar', description: 'Subir datos', icon: Upload },
  { id: 1, title: 'Editar', description: 'Modificar items', icon: Table2 },
  { id: 2, title: 'Imágenes', description: 'Gestionar fotos', icon: ImageIcon },
  { id: 3, title: 'Descripciones', description: 'Mejorar textos', icon: FileText },
  { id: 4, title: 'Vista Previa', description: 'Revisar informe', icon: Eye },
  { id: 5, title: 'Exportar', description: 'Descargar PDF', icon: Download },
];

export default function Home() {
  const {
    currentStep,
    setCurrentStep,
    items,
    period,
    client,
    title,
    subtitle,
    setPeriod,
    setClient,
    setTitle,
    setSubtitle,
    reset
  } = useReportStore();

  const [expandedItemIndex, setExpandedItemIndex] = useState<number | null>(null);

  const canProceed = useCallback((step: number): boolean => {
    switch (step) {
      case 0:
        return true;
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        return items.length > 0;
      default:
        return false;
    }
  }, [items.length]);

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1 && canProceed(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, canProceed, setCurrentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep, setCurrentStep]);

  const handleUploadComplete = useCallback(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

  const handleReset = useCallback(() => {
    reset();
    setCurrentStep(0);
  }, [reset, setCurrentStep]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl float" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent/20 rounded-full blur-3xl float" style={{ animationDelay: '-2s' }} />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-primary/15 rounded-full blur-3xl float" style={{ animationDelay: '-4s' }} />
      </div>

      {/* Header - Glassmorphism */}
      <header className="glass-header sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg glow">
                  <Construction className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text tracking-tight">PAQUIURCISNER</h1>
                <p className="text-xs text-muted-foreground">Sistema de Informes de Obra</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="glass-button px-3 py-1 text-xs font-medium">
                <Sparkles className="w-3 h-3 mr-1.5 text-primary" />
                AI Powered
              </Badge>
              <ThemeToggle />
              <SettingsDialog />
              <Button
                variant="ghost"
                size="sm"
                className="glass-button text-xs"
                onClick={handleReset}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Reiniciar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps - Glassmorphism */}
      <div className="glass-header border-b-0">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between overflow-x-auto">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === index;
              const isCompleted = currentStep > index;
              const isAccessible = index === 0 || items.length > 0;

              return (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <button
                    onClick={() => isAccessible && setCurrentStep(index)}
                    disabled={!isAccessible}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'glass-card bg-primary/10 border-primary/30 shadow-lg scale-105'
                        : isCompleted
                        ? 'glass-button bg-primary/5'
                        : isAccessible
                        ? 'glass-button hover:bg-white/20 dark:hover:bg-white/5'
                        : 'opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-gradient-to-br from-primary to-accent text-white shadow-md'
                        : isCompleted
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? (
                        <span className="text-sm font-bold">✓</span>
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="text-left hidden md:block">
                      <p className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>{step.title}</p>
                      <p className="text-[10px] text-muted-foreground">{step.description}</p>
                    </div>
                  </button>

                  {index < STEPS.length - 1 && (
                    <div className={`w-6 h-0.5 mx-1 rounded-full transition-all ${
                      currentStep > index ? 'bg-gradient-to-r from-primary to-accent' : 'bg-border'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 0: Upload */}
            {currentStep === 0 && (
              <Card className="glass-card gradient-border overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Upload className="w-4 h-4 text-white" />
                    </div>
                    Cargar Datos
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Sube una imagen del Excel o un archivo CSV con los datos del informe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUploader onUploadComplete={handleUploadComplete} />
                </CardContent>
              </Card>
            )}

            {/* Step 1: Data Editor */}
            {currentStep === 1 && (
              <Card className="glass-card gradient-border overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Table2 className="w-4 h-4 text-white" />
                    </div>
                    Editor de Items
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Edita los códigos, títulos y descripciones de cada item
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Metadata Inputs - Glassmorphism */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 glass rounded-xl">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Cliente</Label>
                      <Input
                        value={client}
                        onChange={(e) => setClient(e.target.value)}
                        placeholder="Haug S.A."
                        className="bg-white/50 dark:bg-white/5 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Período</Label>
                      <Input
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        placeholder="DEL 9 AL 15/02/2026"
                        className="bg-white/50 dark:bg-white/5 border-white/20"
                      />
                    </div>
                  </div>

                  <DataTable
                    expandedIndex={expandedItemIndex}
                    onExpand={setExpandedItemIndex}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 2: Image Manager */}
            {currentStep === 2 && (
              <Card className="glass-card gradient-border overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-white" />
                    </div>
                    Gestor de Imágenes
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Agrega imágenes a cada item con fechas automáticas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Global Date Renderer */}
                  <GlobalDateRenderer />
                  
                  {items.length > 0 ? (
                    <Tabs defaultValue="0" className="w-full">
                      <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1 glass rounded-xl">
                        {items.filter(i => i.isActive).map((item) => {
                          const index = items.indexOf(item);
                          return (
                            <TabsTrigger 
                              key={item.id} 
                              value={index.toString()} 
                              className="flex items-center gap-2 data-[state=active]:bg-white/50 dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-lg px-3 py-1.5"
                            >
                              <span className="truncate max-w-[80px] text-sm">{item.codigo}</span>
                              {item.images.length > 0 && (
                                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                                  {item.images.filter(img => img.includeInPdf).length}
                                </Badge>
                              )}
                            </TabsTrigger>
                          );
                        })}
                      </TabsList>
                      {items.filter(i => i.isActive).map((item) => {
                        const index = items.indexOf(item);
                        return (
                          <TabsContent key={item.id} value={index.toString()} className="mt-4">
                            <div className="space-y-4">
                              <div className="p-3 glass rounded-xl">
                                <p className="text-sm font-medium">{item.titulo}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {item.codigo}
                                </p>
                              </div>
                              <ImageManager itemIndex={index} />
                            </div>
                          </TabsContent>
                        );
                      })}
                    </Tabs>
                  ) : (
                    <div className="text-center py-12 glass rounded-xl">
                      <ImageIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-sm font-medium text-muted-foreground">No hay items activos</p>
                      <p className="text-xs mt-1 text-muted-foreground/70">Agrega items para gestionar imágenes</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Description Editor */}
            {currentStep === 3 && (
              <Card className="glass-card gradient-border overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    Editor de Descripciones
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Genera descripciones técnicas con IA o edita manualmente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable
                    expandedIndex={expandedItemIndex}
                    onExpand={setExpandedItemIndex}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 4: Preview */}
            {currentStep === 4 && (
              <Card className="glass-card gradient-border overflow-hidden lg:hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                    Vista Previa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PreviewPanel />
                </CardContent>
              </Card>
            )}

            {/* Step 5: Export */}
            {currentStep === 5 && (
              <Card className="glass-card gradient-border overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Download className="w-4 h-4 text-white" />
                    </div>
                    Exportar Informe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Title Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 glass rounded-xl">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Título del Informe</Label>
                        <Input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="INFORME DE AVANCE DE OBRA"
                          className="bg-white/50 dark:bg-white/5 border-white/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Subtítulo</Label>
                        <Input
                          value={subtitle}
                          onChange={(e) => setSubtitle(e.target.value)}
                          placeholder="Estructuras Metálicas"
                          className="bg-white/50 dark:bg-white/5 border-white/20"
                        />
                      </div>
                    </div>

                    {/* Summary - Glassmorphism Cards */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 glass rounded-xl text-center hover:scale-105 transition-transform">
                        <p className="text-3xl font-bold gradient-text">
                          {items.filter(i => i.isActive).length}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Items</p>
                      </div>
                      <div className="p-4 glass rounded-xl text-center hover:scale-105 transition-transform">
                        <p className="text-3xl font-bold gradient-text">
                          {items.reduce((sum, i) => sum + i.images.filter(img => img.includeInPdf).length, 0)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Imágenes</p>
                      </div>
                      <div className="p-4 glass rounded-xl text-center hover:scale-105 transition-transform">
                        <p className="text-3xl font-bold gradient-text">
                          {Math.ceil(items.reduce((sum, i) => sum + i.images.filter(img => img.includeInPdf).length, 0) / 4) || 1}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Páginas</p>
                      </div>
                    </div>

                    <Separator className="opacity-50" />

                    {/* Export Options */}
                    <div className="flex flex-col items-center gap-4 py-4">
                      <div className="p-4 glass rounded-xl text-center max-w-sm">
                        <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <p className="text-sm font-medium">Tu informe está listo</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Exporta en formato HTML optimizado para impresión PDF
                        </p>
                      </div>
                      <ExportButtons />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="glass-button rounded-xl px-5"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>

              <div className="flex items-center gap-2 px-4 py-2 glass rounded-full">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-medium text-muted-foreground">
                  Paso {currentStep + 1} de {STEPS.length}
                </span>
              </div>

              <Button
                onClick={handleNext}
                disabled={currentStep === STEPS.length - 1 || !canProceed(currentStep)}
                className="rounded-xl px-5 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg"
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <Card className="glass-card gradient-border overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Eye className="w-3 h-3 text-white" />
                    </div>
                    Vista Previa en Vivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
                    <PreviewPanel />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Glassmorphism */}
      <footer className="glass-header mt-8 py-4 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Building2 className="w-3 h-3 text-white" />
              </div>
              <span className="text-muted-foreground">PAQUIURCISNER</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs">Powered by AI</span>
            </div>
          </div>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}
