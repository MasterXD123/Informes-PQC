'use client';

import { useCallback, useState } from 'react';
import { Calendar, Image as ImageIcon, Loader2, Undo2, Clock, Edit2, Check, X, Settings, Move, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useReportStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import {
  parsePeriodToDates,
  generateRandomDate,
  formatDateForRender,
  renderDateOnImage,
} from '@/lib/date-renderer';
import { compressIfNeeded, clearOldDataIfNeeded } from '@/lib/image-compression';

interface ImageWithIndex {
  image: {
    id: string;
    file: string;
    note: string;
    includeInPdf: boolean;
    assignedDate?: string;
    renderedDate?: string;
    originalFile?: string;
  };
  itemIndex: number;
  imageIndex: number;
  itemTitle: string;
}

export function GlobalDateRenderer() {
  const { items, period, updateItemImage } = useReportStore();
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [editingIndex, setEditingIndex] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(28);
  const [paddingX, setPaddingX] = useState(30);
  const [paddingY, setPaddingY] = useState(40);
  const { toast } = useToast();

  const allImages: ImageWithIndex[] = [];
  
  items.forEach((item, itemIndex) => {
    if (!item.isActive) return;
    item.images.forEach((img, imageIndex) => {
      if (img.includeInPdf) {
        allImages.push({
          image: img,
          itemIndex,
          imageIndex,
          itemTitle: item.titulo,
        });
      }
    });
  });

  const imagesWithAssignedDates = allImages.filter(({ image }) => image.assignedDate).length;
  const imagesWithRenderedDates = allImages.filter(({ image }) => image.renderedDate).length;

  const handleAssignDates = useCallback(async () => {
    if (allImages.length === 0) {
      toast({
        title: 'Sin imágenes',
        description: 'No hay imágenes activas para asignar fechas',
        variant: 'destructive',
      });
      return;
    }

    const dateRange = parsePeriodToDates(period);
    if (!dateRange) {
      toast({
        title: 'Período inválido',
        description: 'Configure un período válido. Ejemplo: "Del 9 al 15 de febrero de 2026"',
        variant: 'destructive',
      });
      return;
    }

    setIsAssigning(true);

    try {
      let assigned = 0;
      
      for (const { image, itemIndex, imageIndex } of allImages) {
        const randomDate = generateRandomDate(dateRange.start, dateRange.end);
        const dateText = formatDateForRender(randomDate);

        updateItemImage(itemIndex, imageIndex, {
          assignedDate: dateText,
        });
        assigned++;
      }

      toast({
        title: 'Fechas asignadas',
        description: `Se asignaron fechas a ${assigned} imágenes. Revise y edite si es necesario.`,
      });
    } catch (error) {
      console.error('Error assigning dates:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron asignar las fechas',
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  }, [allImages, period, updateItemImage, toast]);

  const handleRenderDates = useCallback(async () => {
    const imagesToRender = allImages.filter(({ image }) => image.assignedDate && !image.renderedDate);
    
    if (imagesToRender.length === 0) {
      toast({
        title: 'Sin cambios',
        description: 'Todas las fechas ya están renderizadas o no hay fechas asignadas',
      });
      return;
    }

    setIsRendering(true);

    try {
      clearOldDataIfNeeded();
      
      let rendered = 0;
      
      for (const { image, itemIndex, imageIndex } of imagesToRender) {
        const sourceImage = image.originalFile || image.file;
        
        const renderedImage = await renderDateOnImage(
          sourceImage, 
          image.assignedDate!, 
          fontSize,
          false,
          '#FFFFFF',
          paddingX,
          paddingY
        );
        
        const compressedImage = await compressIfNeeded(renderedImage, 1.2);

        updateItemImage(itemIndex, imageIndex, {
          file: compressedImage,
          renderedDate: image.assignedDate,
          originalFile: image.originalFile || image.file,
        });
        rendered++;
      }

      toast({
        title: 'Fechas renderizadas',
        description: `Se renderizaron fechas en ${rendered} imágenes`,
      });
    } catch (error) {
      console.error('Error rendering dates:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron renderizar las fechas. Intente con menos imágenes.',
        variant: 'destructive',
      });
    } finally {
      setIsRendering(false);
    }
  }, [allImages, updateItemImage, toast, fontSize, paddingX, paddingY]);

  const handleResetAll = useCallback(() => {
    let resetCount = 0;
    
    items.forEach((item, itemIndex) => {
      if (!item.isActive) return;
      
      item.images.forEach((image, imageIndex) => {
        if (image.assignedDate || image.renderedDate || image.originalFile) {
          updateItemImage(itemIndex, imageIndex, {
            file: image.originalFile || image.file,
            assignedDate: undefined,
            renderedDate: undefined,
            originalFile: undefined,
          });
          resetCount++;
        }
      });
    });

    toast({
      title: 'Fechas eliminadas',
      description: `Se restauraron ${resetCount} imágenes originales`,
    });
  }, [items, updateItemImage, toast]);

  const handleUpdateDate = useCallback((itemIndex: number, imageIndex: number, newDate: string) => {
    updateItemImage(itemIndex, imageIndex, {
      assignedDate: newDate,
      renderedDate: undefined,
    });
    setEditingIndex(null);
  }, [updateItemImage]);

  const handleClearDate = useCallback((itemIndex: number, imageIndex: number) => {
    updateItemImage(itemIndex, imageIndex, {
      assignedDate: undefined,
      renderedDate: undefined,
    });
  }, [updateItemImage]);

  const dateRange = parsePeriodToDates(period);
  const allHaveDates = allImages.length > 0 && allImages.every(({ image }) => image.assignedDate);
  const allRendered = allImages.length > 0 && allImages.every(({ image }) => image.renderedDate);

  return (
    <div className="glass-card rounded-2xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            {allRendered && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              Fechas en Imágenes
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 glass rounded-lg">
                <Sparkles className="w-2.5 h-2.5 mr-1" />
                Auto
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Asigna fechas aleatorias, edita si necesario, luego renderiza
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="h-8 w-8 p-0 glass-button rounded-lg"
          >
            <Settings className="w-4 h-4" />
          </Button>
          {(imagesWithAssignedDates > 0 || imagesWithRenderedDates > 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetAll}
              disabled={isAssigning || isRendering}
              className="glass-button rounded-lg"
            >
              <Undo2 className="w-4 h-4 mr-1" />
              Restaurar
            </Button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 glass rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Settings className="w-3.5 h-3.5" />
            Configuración de Renderizado
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Tamaño de Letra</Label>
                <span className="text-xs font-mono glass px-2 py-0.5 rounded">{fontSize}px</span>
              </div>
              <Slider
                value={[fontSize]}
                onValueChange={([value]) => setFontSize(value)}
                min={16}
                max={48}
                step={2}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1">
                  <Move className="w-3 h-3" />
                  Padding Horizontal
                </Label>
                <span className="text-xs font-mono glass px-2 py-0.5 rounded">{paddingX}px</span>
              </div>
              <Slider
                value={[paddingX]}
                onValueChange={([value]) => setPaddingX(value)}
                min={10}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1">
                  <Move className="w-3 h-3 rotate-90" />
                  Padding Vertical
                </Label>
                <span className="text-xs font-mono glass px-2 py-0.5 rounded">{paddingY}px</span>
              </div>
              <Slider
                value={[paddingY]}
                onValueChange={([value]) => setPaddingY(value)}
                min={15}
                max={120}
                step={5}
                className="w-full"
              />
            </div>
          </div>
          
          <p className="text-[10px] text-muted-foreground">
            ℹ️ El tamaño se escala automáticamente según las dimensiones de cada imagen.
          </p>
        </div>
      )}

      {/* Status badges */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant={period ? 'default' : 'secondary'} className="rounded-lg px-3 py-1.5">
          {period || 'Sin período'}
        </Badge>
        
        {dateRange && (
          <Badge variant="outline" className="flex items-center gap-1 rounded-lg px-3 py-1.5 glass">
            <Clock className="w-3 h-3" />
            8:00 a.m. - 5:00 p.m.
          </Badge>
        )}
        
        <Badge variant="outline" className="rounded-lg px-3 py-1.5 glass">
          {allImages.length} imágenes
        </Badge>
        
        {imagesWithAssignedDates > 0 && (
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-lg px-3 py-1.5">
            {imagesWithAssignedDates} asignadas
          </Badge>
        )}
        
        {imagesWithRenderedDates > 0 && (
          <Badge variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-300 rounded-lg px-3 py-1.5">
            {imagesWithRenderedDates} renderizadas
          </Badge>
        )}
      </div>

      {/* Warning messages */}
      {!dateRange && period && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            ⚠️ No se pudo interpretar el período. Use formato: "Del 9 al 15 de febrero de 2026"
          </p>
        </div>
      )}
      
      {!period && (
        <div className="p-3 glass rounded-xl">
          <p className="text-xs text-muted-foreground">
            ℹ️ Configure un período para generar fechas automáticamente.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          onClick={handleAssignDates}
          disabled={isAssigning || isRendering || !dateRange || allImages.length === 0}
          className="glass-button rounded-xl px-4"
        >
          {isAssigning ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              Asignando...
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4 mr-1.5" />
              {allHaveDates ? 'Reasignar' : 'Asignar Fechas'}
            </>
          )}
        </Button>
        
        <Button
          size="sm"
          onClick={handleRenderDates}
          disabled={isAssigning || isRendering || imagesWithAssignedDates === 0 || allRendered}
          className="rounded-xl px-4 bg-gradient-to-r from-primary to-accent hover:opacity-90"
        >
          {isRendering ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              Renderizando...
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4 mr-1.5" />
              Renderizar
            </>
          )}
        </Button>
      </div>

      {/* Image list with editable dates */}
      {allImages.length > 0 && imagesWithAssignedDates > 0 && (
        <div className="mt-2 space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Edit2 className="w-3 h-3" />
            Fechas asignadas (clic para editar)
          </h4>
          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-2">
            {allImages.map(({ image, itemIndex, imageIndex, itemTitle }, idx) => {
              const isEditing = editingIndex === `${itemIndex}-${imageIndex}`;
              
              return (
                <div 
                  key={`${itemIndex}-${imageIndex}`}
                  className="flex items-center gap-2 p-2 glass rounded-xl text-xs hover:shadow-md transition-shadow"
                >
                  <span className="text-muted-foreground w-5 text-center font-mono">{idx + 1}</span>
                  <img 
                    src={image.file} 
                    alt="" 
                    className="w-8 h-8 object-cover rounded-lg ring-1 ring-black/5"
                  />
                  <span className="flex-1 truncate font-medium">{itemTitle}</span>
                  
                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-1">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-7 text-xs flex-1 bg-white/50 dark:bg-white/5"
                        placeholder="Fecha..."
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-green-500/20"
                        onClick={() => handleUpdateDate(itemIndex, imageIndex, editValue)}
                      >
                        <Check className="w-3 h-3 text-green-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-destructive/20"
                        onClick={() => setEditingIndex(null)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span 
                        className={`flex-1 cursor-pointer px-2 py-1 rounded-lg transition-colors ${
                          image.renderedDate 
                            ? 'bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20' 
                            : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20'
                        }`}
                        onClick={() => {
                          setEditingIndex(`${itemIndex}-${imageIndex}`);
                          setEditValue(image.assignedDate || '');
                        }}
                        title="Clic para editar"
                      >
                        {image.assignedDate || 'Sin fecha'}
                        {image.renderedDate && ' ✓'}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                        onClick={() => {
                          setEditingIndex(`${itemIndex}-${imageIndex}`);
                          setEditValue(image.assignedDate || '');
                        }}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
