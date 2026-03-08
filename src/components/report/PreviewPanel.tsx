'use client';

import { useMemo, useState } from 'react';
import { FileText, Image as ImageIcon, Building2, Calendar, User, Edit3, Check, X, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useReportStore } from '@/lib/store';
import { useConfigStore } from '@/lib/config-store';

export function PreviewPanel() {
  const { title, subtitle, client, period, items, updateItem } = useReportStore();
  const { company } = useConfigStore();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const activeItems = useMemo(() => items.filter(item => item.isActive), [items]);

  // Count total visual elements (images count as elements)
  const totalVisualElements = useMemo(() => {
    return activeItems.reduce((sum, item) => {
      const images = item.images.filter(img => img.includeInPdf);
      return sum + Math.max(1, images.length);
    }, 0);
  }, [activeItems]);

  const handleStartEdit = (index: number, currentText: string) => {
    setEditingIndex(index);
    setEditText(currentText);
  };

  const handleSaveEdit = (index: number) => {
    updateItem(index, { descripcion: editText });
    setEditingIndex(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditText('');
  };

  if (items.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center glass-card">
        <CardContent className="text-center py-12">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4 border border-white/30 backdrop-blur-sm">
            <FileText className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold gradient-text">Vista Previa</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
            Carga datos para ver la vista previa del informe
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 text-black dark:text-white rounded-xl shadow-lg overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
      {/* Header */}
      <div 
        className="py-3 px-4 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${company.primaryColor} 0%, ${company.secondaryColor} 100%)` }}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-white" />
          <div className="absolute -bottom-8 -left-8 w-16 h-16 rounded-full bg-white" />
        </div>
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            {company.logo ? (
              <img src={company.logo} alt={company.name} className="w-10 h-10 object-contain bg-white rounded-lg p-1" />
            ) : (
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Building2 className="w-6 h-6" />
              </div>
            )}
            <div>
              <h2 className="text-base font-bold">{company.name}</h2>
              <p className="text-xs text-white/70">Estructuras Metálicas</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium">{title}</p>
            {subtitle && <p className="text-xs text-white/70">{subtitle}</p>}
          </div>
        </div>
      </div>

      <CardContent className="p-3 space-y-3">
        {/* Metadata */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Cliente</p>
              <p className="text-xs font-medium">{client}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Período</p>
              <p className="text-xs font-medium">{period || 'Sin especificar'}</p>
            </div>
          </div>
        </div>

        {/* Visual Elements Grid (2x2 preview) */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
              <FileText className="w-3 h-3 text-primary" />
            </div>
            Elementos ({totalVisualElements} • {Math.ceil(totalVisualElements / 4)} pág.)
          </h4>

          {/* Items List with Edit */}
          {activeItems.map((item, index) => {
            const itemImages = item.images.filter(img => img.includeInPdf);
            const elementCount = Math.max(1, itemImages.length);
            const globalIndex = items.indexOf(item);
            const isEditing = editingIndex === globalIndex;
            
            return (
              <div
                key={item.id}
                className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Item Header */}
                <div className="p-2 bg-gray-50 dark:bg-gray-800 border-b">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: company.primaryColor }}
                    >
                      {index + 1}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: company.primaryColor }}>
                      {item.codigo}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                      {elementCount} elem.
                    </span>
                  </div>
                  <p className="text-xs font-medium mt-1">{item.titulo}</p>
                </div>

                {/* Item Description - Editable */}
                <div className="p-2 border-b bg-white dark:bg-gray-900">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="min-h-[60px] text-xs rounded-lg"
                        placeholder="Descripción corta..."
                        rows={2}
                      />
                      <div className="flex gap-1 justify-end">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 px-2 rounded-lg"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          className="h-6 px-2 rounded-lg"
                          onClick={() => handleSaveEdit(globalIndex)}
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="flex items-start gap-2 cursor-pointer group"
                      onClick={() => handleStartEdit(globalIndex, item.descripcion || '')}
                    >
                      {item.descripcion ? (
                        <p className="text-xs text-gray-600 dark:text-gray-300 flex-1">{item.descripcion}</p>
                      ) : (
                        <p className="text-xs text-gray-400 italic flex-1">Click para agregar descripción...</p>
                      )}
                      <Edit3 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>

                {/* Item Images Preview */}
                {itemImages.length > 0 && (
                  <div className="p-1 bg-gray-50 dark:bg-gray-800">
                    <div className="grid grid-cols-2 gap-1">
                      {itemImages.slice(0, 4).map((image, imgIdx) => (
                        <div key={image.id} className="relative aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                          <img 
                            src={image.file} 
                            alt={image.note || `Imagen ${imgIdx + 1}`}
                            className="w-full h-full object-cover"
                            style={{
                              transform: `rotate(${image.rotation}deg)`,
                              filter: `brightness(${image.brightness}%) contrast(${image.contrast}%)`
                            }}
                          />
                          {itemImages.length > 1 && (
                            <span className="absolute top-1 right-1 bg-black/50 text-white text-[10px] px-1.5 rounded-md">
                              {imgIdx + 1}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {itemImages.length > 4 && (
                      <p className="text-xs text-center text-gray-500 mt-1">
                        +{itemImages.length - 4} más
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Footer */}
        <div 
          className="p-3 text-white rounded-xl relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${company.primaryColor} 0%, ${company.secondaryColor} 100%)` }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-8 -right-8 w-16 h-16 rounded-full bg-white" />
          </div>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <p className="text-xs text-white/70 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Resumen
              </p>
              <p className="text-sm font-bold mt-1">
                {activeItems.length} items • {totalVisualElements} elementos
              </p>
            </div>
            <div className="text-right text-white/70 text-xs bg-white/10 rounded-lg px-2 py-1">
              <p>Grid 2x2</p>
              <p className="font-medium text-white">{Math.ceil(totalVisualElements / 4)} páginas</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pt-2 border-t">
          <p>{company.name}</p>
        </div>
      </CardContent>
    </div>
  );
}
