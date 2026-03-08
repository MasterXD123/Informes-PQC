import { z } from 'zod';

// Schema for ReportItem validation
export const ReportItemSchema = z.object({
  id: z.string().min(1),
  codigo: z.string().max(50).default(''),
  titulo: z.string().max(200).default(''),
  fabricacion: z.string().max(500).optional(),
  descripcion: z.string().max(1000).optional(),
  isActive: z.boolean().default(true),
  images: z.array(z.any()).default([]),
});

// Schema for ImageItem validation
export const ImageItemSchema = z.object({
  id: z.string().min(1),
  file: z.string().min(1),
  note: z.string().max(200).default(''),
  displayMode: z.enum(['original', 'autoadjust']).default('original'),
  includeInPdf: z.boolean().default(true),
  rotation: z.number().min(0).max(360).default(0),
  brightness: z.number().min(50).max(150).default(100),
  contrast: z.number().min(50).max(150).default(100),
  assignedDate: z.string().optional(),
  renderedDate: z.string().optional(),
  originalFile: z.string().optional(),
});

// Schema for report metadata
export const ReportMetadataSchema = z.object({
  period: z.string().max(100).default(''),
  client: z.string().max(100).default(''),
  title: z.string().max(100).default('INFORME DE AVANCE DE OBRA'),
  subtitle: z.string().max(100).optional(),
});

// Sanitize string input to prevent XSS
export function sanitizeString(input: string): string {
  if (!input) return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate and sanitize input
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { 
      success: false, 
      error: result.error.errors.map(e => e.message).join(', ') 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Validation failed' 
    };
  }
}

// Type exports
export type ReportItemInput = z.infer<typeof ReportItemSchema>;
export type ImageItemInput = z.infer<typeof ImageItemSchema>;
export type ReportMetadataInput = z.infer<typeof ReportMetadataSchema>;
