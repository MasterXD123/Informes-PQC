'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FileSpreadsheet, Clipboard, Upload, Table, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface CSVColumnMapping {
  csvColumn: string;
  targetField: string; // 'codigo', 'titulo', 'descripcion', 'fabricacion', 'ignore'
}

export interface ParsedCSVData {
  headers: string[];
  rows: string[][];
  detectedSeparator: ',' | ';';
}

interface CSVMapperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: ParsedCSVData, mapping: CSVColumnMapping[]) => void;
}

const TARGET_FIELDS = [
  { value: 'ignore', label: '-- No usar --', description: 'Esta columna no se importará' },
  { value: 'codigo', label: 'Código', description: 'Código del proyecto (ej: P2219-OBRA)' },
  { value: 'titulo', label: 'Título / Ítem', description: 'Nombre del item o trabajo' },
  { value: 'descripcion', label: 'Descripción / Fabricación', description: 'Descripción del trabajo realizado' },
  { value: 'cliente', label: 'Cliente', description: 'Nombre del cliente (se usará solo una vez)' },
  { value: 'periodo', label: 'Período', description: 'Período del informe (se usará solo una vez)' },
];

export function CSVMapperDialog({ open, onOpenChange, onImport }: CSVMapperDialogProps) {
  const [activeTab, setActiveTab] = useState('paste');
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedCSVData | null>(null);
  const [mapping, setMapping] = useState<CSVColumnMapping[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Parse a single CSV line handling quoted values (declared first to avoid hoisting issues)
  const parseCSVLine = useCallback((line: string, separator: ',' | ';'): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }, []);

  // Detect separator and parse CSV
  const parseCSV = useCallback((text: string): ParsedCSVData | null => {
    const trimmed = text.trim();
    if (!trimmed) return null;

    // Detect separator (count occurrences in first line)
    const firstLine = trimmed.split('\n')[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const separator: ',' | ';' = semicolonCount > commaCount ? ';' : ',';

    const lines = trimmed.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      setError('El CSV debe tener al menos una fila de encabezado y una fila de datos');
      return null;
    }

    // Parse headers
    const headers = parseCSVLine(lines[0], separator);
    
    // Parse rows
    const rows: string[][] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i], separator);
      if (values.some(v => v.trim())) {
        rows.push(values);
      }
    }

    if (rows.length === 0) {
      setError('No se encontraron filas de datos válidas');
      return null;
    }

    return { headers, rows, detectedSeparator: separator };
  }, [parseCSVLine]);

  // Auto-detect mapping based on header names
  const autoDetectMapping = useCallback((headers: string[]): CSVColumnMapping[] => {
    return headers.map(header => {
      const headerLower = header.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      let targetField = 'ignore';
      
      // Código detection
      if (headerLower.includes('codigo') || headerLower.includes('código') || 
          headerLower.includes('proyecto') || headerLower.includes('code')) {
        targetField = 'codigo';
      }
      // Título / Ítem detection
      else if (headerLower.includes('item') || headerLower.includes('ítem') || 
               headerLower.includes('titulo') || headerLower.includes('título') ||
               headerLower === 'descripcion' || headerLower === 'descripción') {
        targetField = 'titulo';
      }
      // Fabricación / Descripción detallada
      else if (headerLower.includes('fabricacion') || headerLower.includes('fabricación') ||
               headerLower.includes('trabajo') || headerLower.includes('detalle')) {
        targetField = 'descripcion';
      }
      // Cliente
      else if (headerLower.includes('cliente') || headerLower.includes('client')) {
        targetField = 'cliente';
      }
      // Período
      else if (headerLower.includes('periodo') || headerLower.includes('período') ||
               headerLower.includes('period') || headerLower.includes('fecha')) {
        targetField = 'periodo';
      }

      return { csvColumn: header, targetField };
    });
  }, []);

  const handleParseText = useCallback(() => {
    setError(null);
    const data = parseCSV(rawText);
    if (data) {
      setParsedData(data);
      setMapping(autoDetectMapping(data.headers));
    }
  }, [rawText, parseCSV, autoDetectMapping]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      setError(null);
      const data = parseCSV(text);
      if (data) {
        setParsedData(data);
        setMapping(autoDetectMapping(data.headers));
        setActiveTab('preview');
      }
    };
    reader.readAsText(file, 'UTF-8');
  }, [parseCSV, autoDetectMapping]);

  const handleMappingChange = useCallback((csvColumn: string, targetField: string) => {
    setMapping(prev => 
      prev.map(m => 
        m.csvColumn === csvColumn ? { ...m, targetField } : m
      )
    );
  }, []);

  const handleImport = useCallback(() => {
    if (!parsedData) return;

    // Check if required fields are mapped
    const hasCodigo = mapping.some(m => m.targetField === 'codigo');
    const hasTitulo = mapping.some(m => m.targetField === 'titulo');

    if (!hasCodigo && !hasTitulo) {
      setError('Debe asignar al menos una columna como "Código" o "Título"');
      return;
    }

    onImport(parsedData, mapping);
    
    // Reset state
    setRawText('');
    setParsedData(null);
    setMapping([]);
    setError(null);
    setActiveTab('paste');
  }, [parsedData, mapping, onImport]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    // Don't reset state to allow re-opening with same data
  }, [onOpenChange]);

  // Preview data with current mapping
  const previewItems = useMemo(() => {
    if (!parsedData || mapping.length === 0) return [];

    return parsedData.rows.slice(0, 5).map(row => {
      const item: Record<string, string> = {};
      mapping.forEach((m, idx) => {
        if (m.targetField !== 'ignore') {
          item[m.targetField] = row[idx] || '';
        }
      });
      return item;
    });
  }, [parsedData, mapping]);

  // Check for mapping conflicts
  const mappingConflicts = useMemo(() => {
    const usedFields = mapping.filter(m => m.targetField !== 'ignore').map(m => m.targetField);
    const duplicates = usedFields.filter((field, idx) => usedFields.indexOf(field) !== idx);
    return [...new Set(duplicates)];
  }, [mapping]);

  const hasRequiredFields = mapping.some(m => m.targetField === 'codigo' || m.targetField === 'titulo');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar desde CSV
          </DialogTitle>
          <DialogDescription>
            Pega el contenido CSV, arrastra un archivo o súbelo. Luego asigna las columnas a los campos del sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="paste" className="flex items-center gap-2">
                <Clipboard className="w-4 h-4" />
                Pegar Texto
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Subir Archivo
              </TabsTrigger>
              <TabsTrigger value="preview" disabled={!parsedData} className="flex items-center gap-2">
                <Table className="w-4 h-4" />
                Asignar Columnas
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden mt-4">
              <TabsContent value="paste" className="h-full mt-0">
                <div className="space-y-4 h-full flex flex-col">
                  <Textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={`Pega aquí el contenido CSV. Ejemplo:

Cliente;Periodo;Ítem;Código;Fabricación
Haug S.A.;"Del 9 al 15 de febrero";H2-CAJÓN;P2219-OBRA;"Fabricación y soldadura..."
Haug S.A.;"Del 9 al 15 de febrero";DUCTO;P2242-FLUOR;"Corte y conformado..."

Separadores soportados: coma (,) o punto y coma (;)`}
                    className="flex-1 min-h-[300px] font-mono text-sm"
                  />
                  <Button onClick={handleParseText} disabled={!rawText.trim()}>
                    Analizar CSV
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="h-full mt-0">
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg min-h-[300px]">
                  <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Sube tu archivo CSV</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    El archivo debe estar codificado en UTF-8
                  </p>
                  <label>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button asChild>
                      <span className="cursor-pointer">Seleccionar Archivo</span>
                    </Button>
                  </label>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="h-full mt-0 overflow-hidden">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4 pr-4">
                    {error && (
                      <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p className="text-sm">{error}</p>
                      </div>
                    )}

                    {parsedData && (
                      <>
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {parsedData.headers.length} columnas
                            </Badge>
                            <Badge variant="secondary">
                              {parsedData.rows.length} filas
                            </Badge>
                            <Badge variant="outline">
                              Separador: "{parsedData.detectedSeparator}"
                            </Badge>
                          </div>
                          {mappingConflicts.length > 0 && (
                            <Badge variant="destructive">
                              Conflictos: {mappingConflicts.join(', ')}
                            </Badge>
                          )}
                        </div>

                        {/* Column Mapping */}
                        <div className="space-y-2">
                          <Label className="text-base font-semibold">Asignación de Columnas</Label>
                          <p className="text-sm text-muted-foreground">
                            Asigna cada columna del CSV a un campo del sistema
                          </p>
                          
                          <div className="grid gap-2 mt-3">
                            {parsedData.headers.map((header, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{header}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    Ejemplo: {parsedData.rows[0]?.[idx] || '(vacío)'}
                                  </p>
                                </div>
                                <Select
                                  value={mapping.find(m => m.csvColumn === header)?.targetField || 'ignore'}
                                  onValueChange={(value) => handleMappingChange(header, value)}
                                >
                                  <SelectTrigger className="w-[200px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {TARGET_FIELDS.map(field => (
                                      <SelectItem key={field.value} value={field.value}>
                                        {field.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Preview Table */}
                        {previewItems.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-base font-semibold">Vista Previa de Importación</Label>
                            <Card>
                              <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                      <tr>
                                        {Object.keys(previewItems[0]).map(key => (
                                          <th key={key} className="px-3 py-2 text-left font-medium">
                                            {TARGET_FIELDS.find(f => f.value === key)?.label || key}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {previewItems.map((item, idx) => (
                                        <tr key={idx} className="border-t">
                                          {Object.values(item).map((value, vidx) => (
                                            <td key={vidx} className="px-3 py-2 text-muted-foreground">
                                              {value || '-'}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {hasRequiredFields ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Listo para importar
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Asigna Código o Título
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={!parsedData || !hasRequiredFields}
              >
                Importar {parsedData?.rows.length || 0} registros
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
