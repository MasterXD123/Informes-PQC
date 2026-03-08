'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Upload, 
  GripVertical, 
  RotateCw, 
  Sun, 
  Contrast,
  FileText,
  Check,
  Trash2,
  Calendar,
  Image as ImageIcon,
  Loader2,
  Edit2,
  Clipboard,
  CheckCircle,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useReportStore, ImageItem, generateId } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  parsePeriodToDates,
  generateRandomDate,
  formatDateForRender,
  renderDateOnImage,
} from '@/lib/date-renderer';
import { compressIfNeeded, clearOldDataIfNeeded } from '@/lib/image-compression';

interface ImageManagerProps {
  itemIndex: number;
}

interface SortableImageProps {
  image: ImageItem;
  imageIndex: number;
  onEdit: () => void;
  onRemove: () => void;
  onTogglePdf: () => void;
  previewSize: number;
}

function SortableImage({ image, imageIndex, onEdit, onRemove, onTogglePdf, previewSize }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  const imgHeight = previewSize;
  const imgWidth = Math.round(previewSize * 1.2);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative glass-card rounded-2xl overflow-hidden transition-all duration-300 ${
        isDragging ? 'z-10 scale-[1.02] shadow-2xl ring-2 ring-primary/50' : 'hover:shadow-xl hover:scale-[1.01]'
      }`}
    >
      <div className="flex items-stretch">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center w-12 glass cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors rounded-l-2xl"
        >
          <GripVertical className="w-5 h-5 text-muted-foreground/50" />
        </div>
        
        {/* Image Preview */}
        <div 
          className="relative bg-black/20 flex-shrink-0 overflow-hidden"
          style={{ width: imgWidth, height: imgHeight }}
        >
          <img
            src={image.file}
            alt={image.note || 'Image'}
            className="w-full h-full object-cover"
            style={{
              transform: `rotate(${image.rotation}deg)`,
              filter: `brightness(${image.brightness}%) contrast(${image.contrast}%)`,
            }}
          />
          
          {/* Overlay badges */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent text-white text-[10px] font-bold flex items-center justify-center shadow-lg">
              {imageIndex + 1}
            </div>
            {image.includeInPdf && (
              <div className="w-5 h-5 rounded-lg bg-green-500/90 backdrop-blur-sm text-white flex items-center justify-center shadow-lg">
                <Check className="w-3 h-3" />
              </div>
            )}
          </div>
          
          {image.renderedDate && (
            <div className="absolute bottom-2 left-2 glass px-2 py-1 rounded-full flex items-center gap-1 text-[9px] text-white">
              <Calendar className="w-3 h-3" />
              Fecha renderizada
            </div>
          )}
          
          {image.assignedDate && !image.renderedDate && (
            <div className="absolute bottom-2 left-2 bg-blue-500/80 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-[9px] text-white">
              <Calendar className="w-3 h-3" />
              Fecha asignada
            </div>
          )}
        </div>
        
        {/* Info & Actions */}
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0 glass">
          <div className="mb-2">
            <p className="text-sm font-semibold truncate mb-0.5">
              {image.note || `Imagen ${imageIndex + 1}`}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {image.displayMode === 'original' ? 'Original' : 'Autoajustada'}
              {image.rotation !== 0 && ` • ${image.rotation}°`}
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 px-2.5 text-[11px] font-medium glass-button rounded-lg" 
              onClick={onEdit}
            >
              <Edit2 className="w-3 h-3 mr-1" />
              Editar
            </Button>
            <Button 
              variant={image.includeInPdf ? "default" : "outline"} 
              size="sm" 
              className={`h-7 px-2.5 text-[11px] font-medium rounded-lg ${
                image.includeInPdf ? 'bg-gradient-to-r from-primary to-accent' : 'glass-button'
              }`}
              onClick={onTogglePdf}
            >
              {image.includeInPdf ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  En PDF
                </>
              ) : (
                'Incluir'
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 px-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-auto rounded-lg" 
              onClick={onRemove}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ImageManager({ itemIndex }: ImageManagerProps) {
  const { items, period, addItemImage, updateItemImage, removeItemImage, reorderItemImages } = useReportStore();
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pasteSuccess, setPasteSuccess] = useState(false);
  const [previewSize, setPreviewSize] = useState(180);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageItems: DataTransferItem[] = [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          imageItems.push(item);
        }
      }

      if (imageItems.length > 0) {
        e.preventDefault();
        setIsUploading(true);
        clearOldDataIfNeeded();

        try {
          for (const item of imageItems) {
            const file = item.getAsFile();
            if (!file) continue;

            const reader = new FileReader();
            await new Promise<void>((resolve) => {
              reader.onload = async (event) => {
                const base64 = event.target?.result as string;
                const compressedBase64 = await compressIfNeeded(base64, 1.5);
                
                const newImage: ImageItem = {
                  id: generateId(),
                  file: compressedBase64,
                  note: '',
                  displayMode: 'original',
                  includeInPdf: true,
                  rotation: 0,
                  brightness: 100,
                  contrast: 100,
                };
                addItemImage(itemIndex, newImage);
                resolve();
              };
              reader.readAsDataURL(file);
            });
          }

          setPasteSuccess(true);
          setTimeout(() => setPasteSuccess(false), 2000);
          
          toast({
            title: 'Imágenes pegadas',
            description: `Se agregaron ${imageItems.length} imagen(es) del portapapeles`,
          });
        } catch {
          toast({
            title: 'Error',
            description: 'No se pudieron pegar las imágenes',
            variant: 'destructive',
          });
        } finally {
          setIsUploading(false);
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [addItemImage, itemIndex, toast]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    const item = items[itemIndex];
    if (!item || !over || active.id === over.id) return;

    const oldIndex = item.images.findIndex((img) => img.id === active.id);
    const newIndex = item.images.findIndex((img) => img.id === over.id);
    reorderItemImages(itemIndex, oldIndex, newIndex);
  }, [items, itemIndex, reorderItemImages]);

  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    setIsUploading(true);
    clearOldDataIfNeeded();
    
    try {
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        if (!file.type.startsWith('image/')) continue;
        
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            const compressedBase64 = await compressIfNeeded(base64, 1.5);
            
            const newImage: ImageItem = {
              id: generateId(),
              file: compressedBase64,
              note: '',
              displayMode: 'original',
              includeInPdf: true,
              rotation: 0,
              brightness: 100,
              contrast: 100,
            };
            addItemImage(itemIndex, newImage);
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
      
      toast({
        title: 'Imágenes cargadas',
        description: `Se agregaron ${fileArray.length} imagen(es)`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las imágenes',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }, [addItemImage, itemIndex, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleImageUpdate = useCallback((imageIndex: number, updates: Partial<ImageItem>) => {
    updateItemImage(itemIndex, imageIndex, updates);
  }, [itemIndex, updateItemImage]);

  const handleImageRemove = useCallback((imageIndex: number) => {
    removeItemImage(itemIndex, imageIndex);
    setEditingImageIndex(null);
  }, [itemIndex, removeItemImage]);

  const handleTogglePdf = useCallback((imageIndex: number) => {
    const item = items[itemIndex];
    if (!item) return;
    const currentStatus = item.images[imageIndex]?.includeInPdf ?? true;
    updateItemImage(itemIndex, imageIndex, { includeInPdf: !currentStatus });
  }, [items, itemIndex, updateItemImage]);

  const handleRenderDates = useCallback(async () => {
    const item = items[itemIndex];
    if (!item || item.images.length === 0) {
      toast({
        title: 'Sin imágenes',
        description: 'No hay imágenes para renderizar fechas',
        variant: 'destructive',
      });
      return;
    }

    const dateRange = parsePeriodToDates(period);
    if (!dateRange) {
      toast({
        title: 'Período inválido',
        description: 'No se pudo interpretar el período',
        variant: 'destructive',
      });
      return;
    }

    setIsRendering(true);

    try {
      for (let i = 0; i < item.images.length; i++) {
        const image = item.images[i];
        if (!image.includeInPdf) continue;

        const randomDate = generateRandomDate(dateRange.start, dateRange.end);
        const dateText = formatDateForRender(randomDate);
        const sourceImage = image.originalFile || image.file;
        const renderedImage = await renderDateOnImage(sourceImage, dateText, 28, false, '#FFFFFF');

        updateItemImage(itemIndex, i, {
          file: renderedImage,
          renderedDate: dateText,
          originalFile: image.originalFile || image.file,
        });
      }

      toast({
        title: 'Fechas renderizadas',
        description: `Se agregaron fechas a ${item.images.filter(img => img.includeInPdf).length} imágenes`,
      });
    } catch (error) {
      console.error('Error rendering dates:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron renderizar las fechas',
        variant: 'destructive',
      });
    } finally {
      setIsRendering(false);
    }
  }, [items, itemIndex, period, updateItemImage, toast]);

  const handleResetDates = useCallback(() => {
    const item = items[itemIndex];
    if (!item) return;

    item.images.forEach((image, i) => {
      if (image.originalFile) {
        updateItemImage(itemIndex, i, {
          file: image.originalFile,
          renderedDate: undefined,
          originalFile: undefined,
        });
      }
    });

    toast({
      title: 'Fechas eliminadas',
      description: 'Se restauraron las imágenes originales',
    });
  }, [items, itemIndex, updateItemImage, toast]);

  const item = items[itemIndex];
  if (!item) return null;

  const imagesWithDates = item.images.filter(img => img.renderedDate).length;
  const dateRange = parsePeriodToDates(period);

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Upload Area - Glassmorphism */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative glass-card rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer
          ${isDragOver 
            ? 'ring-2 ring-primary ring-offset-2 scale-[1.02]' 
            : 'hover:shadow-lg'
          }
          ${pasteSuccess ? 'ring-2 ring-green-500 ring-offset-2' : ''}
        `}
      >
        <label className="cursor-pointer block">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            disabled={isUploading}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Procesando imágenes...</p>
            </div>
          ) : pasteSuccess ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-500" />
              </div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">¡Imágenes pegadas!</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7 text-primary" />
                </div>
                <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center">
                  <Clipboard className="w-7 h-7 text-accent" />
                </div>
              </div>
              <div>
                <p className="text-base font-semibold">
                  Arrastra imágenes, haz clic o pega del portapapeles
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  <kbd className="px-1.5 py-0.5 glass rounded text-[10px] font-mono">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 glass rounded text-[10px] font-mono">V</kbd> para pegar • Múltiples imágenes
                </p>
              </div>
            </div>
          )}
        </label>
      </div>

      {/* Size Control & Stats - Glassmorphism */}
      {item.images.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 glass rounded-2xl">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="glass px-3 py-1.5 text-sm font-medium rounded-xl">
              <ImageIcon className="w-4 h-4 mr-1.5" />
              {item.images.length} imagen{item.images.length !== 1 ? 'es' : ''}
            </Badge>
            <Badge variant="outline" className="glass px-3 py-1.5 text-sm rounded-xl">
              {item.images.filter(i => i.includeInPdf).length} en PDF
            </Badge>
          </div>
          
          {/* Preview Size Slider */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <ZoomOut className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[previewSize]}
              onValueChange={([value]) => setPreviewSize(value)}
              min={120}
              max={350}
              step={10}
              className="w-32"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground w-10 glass px-2 py-1 rounded-lg text-right font-mono">{previewSize}px</span>
          </div>
        </div>
      )}

      {/* Image List - Vertical Layout */}
      {item.images.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={item.images.map(img => img.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {item.images.map((image, imageIndex) => (
                <Dialog 
                  key={image.id} 
                  open={editingImageIndex === imageIndex} 
                  onOpenChange={(open) => setEditingImageIndex(open ? imageIndex : null)}
                >
                  <SortableImage
                    image={image}
                    imageIndex={imageIndex}
                    onEdit={() => setEditingImageIndex(imageIndex)}
                    onRemove={() => handleImageRemove(imageIndex)}
                    onTogglePdf={() => handleTogglePdf(imageIndex)}
                    previewSize={previewSize}
                  />
                  <DialogContent className="max-w-3xl glass-card">
                    <DialogHeader>
                      <DialogTitle>Editar Imagen</DialogTitle>
                    </DialogHeader>
                    <ImageEditor
                      image={image}
                      onUpdate={(updates) => handleImageUpdate(imageIndex, updates)}
                    />
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {item.images.length === 0 && (
        <div className="text-center py-12 glass rounded-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl glass flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium">No hay imágenes para este item</p>
          <p className="text-xs mt-1 text-muted-foreground">Arrastra, haz clic o pega imágenes aquí</p>
        </div>
      )}
    </div>
  );
}

interface ImageEditorProps {
  image: ImageItem;
  onUpdate: (updates: Partial<ImageItem>) => void;
}

function ImageEditor({ image, onUpdate }: ImageEditorProps) {
  const [editingDate, setEditingDate] = useState(false);
  const [dateValue, setDateValue] = useState(image.assignedDate || '');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Image Preview */}
      <div className="space-y-4">
        <div className="aspect-square glass rounded-2xl flex items-center justify-center overflow-hidden">
          <img
            src={image.file}
            alt={image.note || 'Preview'}
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `rotate(${image.rotation}deg)`,
              filter: `brightness(${image.brightness}%) contrast(${image.contrast}%)`,
            }}
          />
        </div>
        
        {image.assignedDate && (
          <div className="p-3 glass rounded-xl">
            <p className="text-[10px] text-muted-foreground mb-1">Fecha asignada:</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-mono flex-1">{image.assignedDate}</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setEditingDate(true)}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
        
        {image.renderedDate && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
            <p className="text-[10px] text-green-600 dark:text-green-400 mb-1">Fecha renderizada:</p>
            <p className="text-sm font-mono text-green-700 dark:text-green-300">{image.renderedDate}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-5">
        {(image.assignedDate || editingDate) && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4" />
              Fecha Asignada
            </Label>
            {editingDate ? (
              <div className="flex gap-2">
                <Input
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                  placeholder="Ej: 13 de febrero de 2026 12:02 p.m."
                  className="flex-1"
                />
                <Button size="sm" onClick={() => { onUpdate({ assignedDate: dateValue, renderedDate: undefined }); setEditingDate(false); }}>
                  OK
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingDate(false)}>
                  ✕
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input value={image.assignedDate || ''} readOnly className="bg-muted/50" />
                <Button size="sm" variant="outline" onClick={() => { setDateValue(image.assignedDate || ''); setEditingDate(true); }}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4" />
            Nota / Descripción
          </Label>
          <Input
            value={image.note}
            onChange={(e) => onUpdate({ note: e.target.value })}
            placeholder="Descripción de la imagen..."
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Modo de Visualización</Label>
          <Select
            value={image.displayMode}
            onValueChange={(value: 'original' | 'autoadjust') => onUpdate({ displayMode: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="original">Original (mantener proporción)</SelectItem>
              <SelectItem value="autoadjust">Autoajustar (uniforme)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between p-3 glass rounded-xl">
          <Label className="font-medium text-sm">Incluir en PDF</Label>
          <Switch
            checked={image.includeInPdf}
            onCheckedChange={(checked) => onUpdate({ includeInPdf: checked })}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm">
              <RotateCw className="w-4 h-4" />
              Rotación
            </Label>
            <span className="text-sm font-mono glass px-2 py-0.5 rounded">{image.rotation}°</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onUpdate({ rotation: (image.rotation - 90 + 360) % 360 })}>
              -90°
            </Button>
            <Slider
              value={[image.rotation]}
              onValueChange={([value]) => onUpdate({ rotation: value })}
              min={0}
              max={360}
              step={90}
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={() => onUpdate({ rotation: (image.rotation + 90) % 360 })}>
              +90°
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm">
              <Sun className="w-4 h-4" />
              Brillo
            </Label>
            <span className="text-sm font-mono glass px-2 py-0.5 rounded">{image.brightness}%</span>
          </div>
          <Slider
            value={[image.brightness]}
            onValueChange={([value]) => onUpdate({ brightness: value })}
            min={50}
            max={150}
            step={5}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm">
              <Contrast className="w-4 h-4" />
              Contraste
            </Label>
            <span className="text-sm font-mono glass px-2 py-0.5 rounded">{image.contrast}%</span>
          </div>
          <Slider
            value={[image.contrast]}
            onValueChange={([value]) => onUpdate({ contrast: value })}
            min={50}
            max={150}
            step={5}
          />
        </div>

        <Button variant="outline" className="w-full glass-button rounded-xl" onClick={() => onUpdate({ rotation: 0, brightness: 100, contrast: 100 })}>
          Restablecer Ajustes
        </Button>
      </div>
    </div>
  );
}
