'use client';

import { useCallback, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown, ChevronRight, Image as ImageIcon, Sparkles, Loader2, TextQuote, Edit3, ArrowRight, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { useReportStore, ReportItem } from '@/lib/store';
import { useConfigStore } from '@/lib/config-store';
import { ImageManager } from './ImageManager';
import { useToast } from '@/hooks/use-toast';

interface SortableRowProps {
  item: ReportItem;
  index: number;
  onUpdate: (index: number, updates: Partial<ReportItem>) => void;
  onToggle: (index: number) => void;
  onExpand: (index: number | null) => void;
  isExpanded: boolean;
}

function SortableRow({
  item,
  index,
  onUpdate,
  onToggle,
  onExpand,
  isExpanded,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasImages = item.images.length > 0;

  return (
    <>
      <TableRow
        ref={setNodeRef}
        style={style}
        className={`${!item.isActive ? 'opacity-50' : ''} ${isDragging ? 'bg-primary/5 scale-[1.01]' : ''} transition-all duration-200 hover:bg-muted/30`}
      >
        <TableCell className="w-10">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-primary/10 rounded-lg transition-colors"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </button>
        </TableCell>
        <TableCell className="w-12">
          <Switch
            checked={item.isActive}
            onCheckedChange={() => onToggle(index)}
          />
        </TableCell>
        <TableCell>
          <Input
            value={item.codigo}
            onChange={(e) => onUpdate(index, { codigo: e.target.value })}
            className="h-9 text-sm min-w-[120px] bg-white/50 dark:bg-white/5 border-white/20 rounded-lg"
            placeholder="Código"
          />
        </TableCell>
        <TableCell className="min-w-[200px]">
          <Input
            value={item.titulo}
            onChange={(e) => onUpdate(index, { titulo: e.target.value })}
            className="h-9 text-sm bg-white/50 dark:bg-white/5 border-white/20 rounded-lg"
            placeholder="Título"
          />
        </TableCell>
        <TableCell className="min-w-[250px]">
          <Textarea
            value={item.descripcion}
            onChange={(e) => onUpdate(index, { descripcion: e.target.value })}
            className="min-h-[40px] h-10 text-sm bg-white/50 dark:bg-white/5 border-white/20 rounded-lg"
            placeholder="Descripción corta..."
            rows={1}
          />
        </TableCell>
        <TableCell className="w-10">
          <Collapsible open={isExpanded} onOpenChange={() => onExpand(isExpanded ? null : index)}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary/10 rounded-lg"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {hasImages && (
              <Badge variant="outline" className="text-xs glass-button rounded-lg px-2">
                <ImageIcon className="w-3 h-3 mr-1" />
                {item.images.length}
              </Badge>
            )}
          </div>
        </TableCell>
      </TableRow>
      
      {/* Expanded Row Content */}
      {isExpanded && (
        <TableRow className={`${!item.isActive ? 'opacity-50' : ''}`}>
          <TableCell colSpan={7} className="p-0">
            <div className="p-5 glass m-2 rounded-xl space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fabricación / Descripción original */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Edit3 className="w-3 h-3" />
                    Fabricación (Descripción Original del CSV)
                  </Label>
                  <Textarea
                    value={item.fabricacion || ''}
                    onChange={(e) => onUpdate(index, { fabricacion: e.target.value })}
                    className="min-h-[80px] text-sm bg-white/50 dark:bg-white/5 border-white/20 rounded-xl"
                    placeholder="Descripción del trabajo de fabricación..."
                    rows={3}
                  />
                  {item.fabricacion && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs glass-button rounded-xl"
                      onClick={() => onUpdate(index, { descripcion: item.fabricacion })}
                    >
                      <ArrowRight className="w-3 h-3 mr-1" />
                      Usar como descripción corta
                    </Button>
                  )}
                </div>
                
                {/* Descripción corta mejorada */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Descripción Corta (para el informe)
                    </Label>
                    {item.fabricacion && !item.descripcion && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs hover:bg-primary/10 rounded-lg"
                        onClick={() => onUpdate(index, { descripcion: item.fabricacion })}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copiar de fabricación
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={item.descripcion}
                    onChange={(e) => onUpdate(index, { descripcion: e.target.value })}
                    className="min-h-[80px] text-sm bg-white/50 dark:bg-white/5 border-white/20 rounded-xl"
                    placeholder="Descripción corta para el informe..."
                    rows={3}
                  />
                </div>
              </div>
              
              {/* Image Manager */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  Imágenes ({item.images.length})
                </Label>
                <ImageManager itemIndex={index} />
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

interface DataTableProps {
  expandedIndex: number | null;
  onExpand: (index: number | null) => void;
}

export function DataTable({ expandedIndex, onExpand }: DataTableProps) {
  const { items, updateItem, toggleItemActive, reorderItems, setMultipleDescriptions } = useReportStore();
  const { getDescriptionApi } = useConfigStore();
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      reorderItems(oldIndex, newIndex);
      onExpand(null);
    }
  }, [items, reorderItems, onExpand]);

  // Generate descriptions for ALL active items at once
  const handleGenerateAllDescriptions = useCallback(async () => {
    const activeItems = items
      .map((item, index) => ({ ...item, originalIndex: index }))
      .filter((item) => item.isActive && item.titulo);

    if (activeItems.length === 0) {
      toast({
        title: 'Error',
        description: 'No hay items activos con título para generar descripciones',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingAll(true);
    try {
      const descriptionApi = getDescriptionApi();
      const externalApi = descriptionApi ? {
        provider: descriptionApi.provider,
        apiKey: descriptionApi.apiKey,
        baseUrl: descriptionApi.baseUrl,
        model: descriptionApi.model,
        descriptionSystemPrompt: descriptionApi.descriptionSystemPrompt,
      } : undefined;

      console.log('Sending items for description generation:', activeItems.length);

      const response = await fetch('/api/generate-descriptions-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: activeItems.map((item) => ({
            index: item.originalIndex,
            codigo: item.codigo || '',
            titulo: item.titulo || '',
            fabricacion: item.fabricacion || '',
          })),
          externalApi,
        }),
      });

      const result = await response.json();
      console.log('API response:', result);

      if (result.success && result.descriptions && result.descriptions.length > 0) {
        setMultipleDescriptions(result.descriptions);
        toast({
          title: 'Descripciones generadas',
          description: `Se generaron ${result.descriptions.length} descripciones técnicas`,
        });
      } else {
        const errorMsg = result.error || result.details || 'Error desconocido';
        console.error('API error:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron generar las descripciones',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingAll(false);
    }
  }, [items, setMultipleDescriptions, toast, getDescriptionApi]);

  const activeItems = items.filter(i => i.isActive);

  return (
    <div className="space-y-4">
      {/* Generate All Button */}
      <div className="flex justify-between items-center p-4 glass rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <TextQuote className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Generar descripciones con IA</p>
            <p className="text-xs text-muted-foreground">Mejora las descripciones automáticamente</p>
          </div>
        </div>
        <Button
          onClick={handleGenerateAllDescriptions}
          disabled={isGeneratingAll || activeItems.length === 0}
          className="rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg"
        >
          {isGeneratingAll ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generar Todas ({activeItems.length})
            </>
          )}
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="glass-card rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/40">
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-12 text-center">
                  <span className="text-xs font-semibold">Activo</span>
                </TableHead>
                <TableHead className="text-xs font-semibold">Código</TableHead>
                <TableHead className="text-xs font-semibold">Título</TableHead>
                <TableHead className="text-xs font-semibold">Descripción Corta</TableHead>
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-20 text-xs font-semibold">Imágenes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {items.map((item, index) => (
                  <SortableRow
                    key={item.id}
                    item={item}
                    index={index}
                    onUpdate={updateItem}
                    onToggle={toggleItemActive}
                    onExpand={onExpand}
                    isExpanded={expandedIndex === index}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </div>
      </DndContext>

      {items.length > 0 && (
        <div className="flex justify-between items-center p-4 glass rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{activeItems.length}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              de {items.length} items activos
            </span>
          </div>
          <Badge variant="secondary" className="glass-button rounded-lg px-3">
            <ImageIcon className="w-3 h-3 mr-1" />
            {items.reduce((sum, i) => sum + i.images.length, 0)} imágenes
          </Badge>
        </div>
      )}
    </div>
  );
}
