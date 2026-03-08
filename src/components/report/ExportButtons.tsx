'use client';

import { useCallback, useState } from 'react';
import { FileDown, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReportStore } from '@/lib/store';
import { useConfigStore } from '@/lib/config-store';
import { useToast } from '@/hooks/use-toast';

interface VisualElement {
  item: any;
  itemIndex: number;
  imageIndex: number;
  image: any | null;
}

export function ExportButtons() {
  const { title, subtitle, client, period, items } = useReportStore();
  const { company } = useConfigStore();
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = useCallback(async () => {
    const activeItems = items.filter(item => item.isActive);

    if (activeItems.length === 0) {
      toast({
        title: 'Error',
        description: 'No hay items activos para exportar',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);

    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subtitle,
          client,
          period,
          items,
          company,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export');
      }

      const htmlContent = await response.text();

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `informe-obra-${period.replace(/\s+/g, '-')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Exportación exitosa',
        description: 'El informe ha sido descargado',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo exportar el informe',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [title, subtitle, client, period, items, company, toast]);

  const handlePrint = useCallback(() => {
    const activeItems = items.filter(item => item.isActive);

    if (activeItems.length === 0) {
      toast({
        title: 'Error',
        description: 'No hay items activos para imprimir',
        variant: 'destructive',
      });
      return;
    }

    const htmlContent = generateHtmlDocument({
      title,
      subtitle,
      client,
      period,
      items,
      company,
    });

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }

    toast({
      title: 'Preparando impresión',
      description: 'Se abrirá una ventana de impresión',
    });
  }, [title, subtitle, client, period, items, company, toast]);

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handlePrint}>
        <Printer className="w-4 h-4 mr-2" />
        Imprimir
      </Button>

      <Button onClick={handleExport} disabled={isExporting}>
        {isExporting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <FileDown className="w-4 h-4 mr-2" />
        )}
        Exportar HTML/PDF
      </Button>
    </div>
  );
}

function generateHtmlDocument(data: {
  title: string;
  subtitle: string;
  client: string;
  period: string;
  items: any[];
  company: any;
}): string {
  const activeItems = data.items.filter(item => item.isActive);
  const company = data.company;
  const today = new Date().toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });

  // Expand items into visual elements
  const visualElements: VisualElement[] = [];
  
  activeItems.forEach((item, itemIdx) => {
    const itemImages = item.images?.filter((img: any) => img.includeInPdf) || [];
    
    if (itemImages.length === 0) {
      visualElements.push({
        item,
        itemIndex: itemIdx,
        imageIndex: -1,
        image: null,
      });
    } else {
      itemImages.forEach((img: any, imgIdx: number) => {
        visualElements.push({
          item,
          itemIndex: itemIdx,
          imageIndex: imgIdx,
          image: img,
        });
      });
    }
  });

  // Group visual elements into pages (4 per page = 2x2 grid)
  const pages: VisualElement[][] = [];
  for (let i = 0; i < visualElements.length; i += 4) {
    pages.push(visualElements.slice(i, i + 4));
  }

  // Generate pages HTML
  const pagesHtml = pages.map((pageElements, pageIndex) => {
    const gridItemsHtml = pageElements.map((element) => {
      const { item, imageIndex, image } = element;
      const hasImage = image !== null;
      const totalImages = item.images?.filter((img: any) => img.includeInPdf).length || 0;
      
      return `
        <div class="card">
          <div class="card-accent"></div>
          <div class="card-body">
            <div class="card-top">
              <div class="card-number">${activeItems.indexOf(item) + 1}</div>
              <div class="card-meta">
                <span class="card-code">${item.codigo}</span>
                ${totalImages > 1 ? `<span class="card-badge">${imageIndex + 1}/${totalImages}</span>` : ''}
              </div>
            </div>
            <h3 class="card-title">${item.titulo}</h3>
            ${item.descripcion ? `<p class="card-desc">${item.descripcion}</p>` : ''}
          </div>
          <div class="card-media">
            ${hasImage ? `
              <img src="${image.file}" 
                   alt="${image.note || item.titulo}" 
                   style="transform: rotate(${image.rotation || 0}deg); filter: brightness(${image.brightness || 100}%) contrast(${image.contrast || 100}%);" />
              ${image.note ? `<span class="media-note">${image.note}</span>` : ''}
            ` : `
              <div class="media-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
                <span>Sin imagen</span>
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');

    const emptyCells = 4 - pageElements.length;
    const emptyCellsHtml = Array(emptyCells).fill('<div class="card card-empty"></div>').join('');

    return `
      ${pageIndex > 0 ? '<div class="page-break"></div>' : ''}
      <div class="page">
        ${pageIndex === 0 ? `
          <header class="doc-header">
            <div class="brand-section">
              <div class="brand-logo">
                ${company.logo 
                  ? `<img src="${company.logo}" alt="${company.name}" />` 
                  : `<div class="brand-initials" style="background: linear-gradient(135deg, ${company.primaryColor} 0%, ${company.secondaryColor} 100%);">
                      ${company.name.substring(0, 2).toUpperCase()}
                    </div>`
                }
              </div>
              <div class="brand-info">
                <h1 class="brand-name">${company.name}</h1>
                <p class="brand-desc">Estructuras Metálicas</p>
              </div>
            </div>
            <div class="doc-info">
              <h2 class="doc-title">${data.title}</h2>
              ${data.subtitle ? `<p class="doc-subtitle">${data.subtitle}</p>` : ''}
              <p class="doc-date">${today}</p>
            </div>
          </header>
          
          <div class="info-strip">
            <div class="info-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <div class="info-content">
                <span class="info-label">Cliente</span>
                <span class="info-value">${data.client}</span>
              </div>
            </div>
            <div class="info-divider"></div>
            <div class="info-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <div class="info-content">
                <span class="info-label">Período</span>
                <span class="info-value">${data.period}</span>
              </div>
            </div>
            <div class="info-divider"></div>
            <div class="info-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <div class="info-content">
                <span class="info-label">Items</span>
                <span class="info-value">${activeItems.length}</span>
              </div>
            </div>
          </div>
        ` : `
          <header class="mini-header">
            <div class="mini-brand">
              ${company.logo 
                ? `<img src="${company.logo}" alt="${company.name}" class="mini-logo" />` 
                : `<span class="mini-initials">${company.name.substring(0, 2).toUpperCase()}</span>`
              }
              <span class="mini-name">${company.name}</span>
            </div>
            <div class="mini-paging">
              <span>${data.title}</span>
              <span class="mini-page">Pág. ${pageIndex + 1} de ${pages.length}</span>
            </div>
          </header>
        `}
        
        <main class="content-grid">
          ${gridItemsHtml}
          ${emptyCellsHtml}
        </main>
        
        <footer class="doc-footer">
          <div class="footer-brand">
            <span class="footer-name">${company.name}</span>
            <span class="footer-sep">•</span>
            <span class="footer-desc">Estructuras Metálicas</span>
          </div>
          <div class="footer-paging">
            Página ${pageIndex + 1} de ${pages.length}
          </div>
        </footer>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title} - ${data.client}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: ${company.primaryColor};
      --secondary: ${company.secondaryColor};
      --accent: ${company.primaryColor};
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: A4;
      margin: 0;
    }
    
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #1a1a2e;
      background: #e8e8e8;
      -webkit-font-smoothing: antialiased;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: white;
      padding: 10mm;
      position: relative;
      display: flex;
      flex-direction: column;
    }
    
    .page-break {
      page-break-before: always;
    }

    /* ========== DOCUMENT HEADER ========== */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 10px;
      border-bottom: 1px solid #e5e5e5;
      margin-bottom: 8px;
      position: relative;
    }
    
    .doc-header::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 80px;
      height: 3px;
      background: linear-gradient(90deg, var(--primary), var(--secondary));
      border-radius: 2px;
    }
    
    .brand-section {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    
    .brand-logo {
      width: 58px;
      height: 58px;
      border-radius: 12px;
      overflow: hidden;
      background: white;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3px;
    }
    
    .brand-logo img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    
    .brand-initials {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      font-size: 18px;
      letter-spacing: -1px;
    }
    
    .brand-info {
      display: flex;
      flex-direction: column;
    }
    
    .brand-name {
      font-size: 20pt;
      font-weight: 800;
      color: var(--primary);
      letter-spacing: -0.5px;
      line-height: 1.1;
    }
    
    .brand-desc {
      font-size: 8pt;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      font-weight: 600;
      margin-top: 2px;
    }
    
    .doc-info {
      text-align: right;
    }
    
    .doc-title {
      font-size: 14pt;
      font-weight: 700;
      color: var(--primary);
      letter-spacing: -0.3px;
      line-height: 1.2;
    }
    
    .doc-subtitle {
      font-size: 9pt;
      color: #666;
      margin-top: 2px;
    }
    
    .doc-date {
      font-size: 7pt;
      color: #999;
      margin-top: 6px;
      text-transform: capitalize;
    }

    /* ========== INFO STRIP ========== */
    .info-strip {
      display: flex;
      align-items: center;
      gap: 14px;
      background: linear-gradient(135deg, 
        rgba(from var(--primary) r g b / 0.04) 0%, 
        rgba(from var(--secondary) r g b / 0.04) 100%
      );
      padding: 10px 14px;
      border-radius: 8px;
      margin-bottom: 10px;
      border: 1px solid rgba(from var(--primary) r g b / 0.08);
    }
    
    .info-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .info-item svg {
      width: 18px;
      height: 18px;
      color: var(--primary);
      flex-shrink: 0;
    }
    
    .info-content {
      display: flex;
      flex-direction: column;
    }
    
    .info-label {
      font-size: 6.5pt;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }
    
    .info-value {
      font-size: 10pt;
      font-weight: 700;
      color: #222;
    }
    
    .info-divider {
      width: 1px;
      height: 32px;
      background: linear-gradient(180deg, transparent, #ddd, transparent);
    }

    /* ========== MINI HEADER ========== */
    .mini-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      border-radius: 8px;
      margin-bottom: 12px;
      color: white;
    }
    
    .mini-brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .mini-logo {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      object-fit: contain;
      background: white;
      padding: 2px;
    }
    
    .mini-initials {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8pt;
      font-weight: 700;
    }
    
    .mini-name {
      font-weight: 600;
      font-size: 9pt;
    }
    
    .mini-paging {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      font-size: 8pt;
    }
    
    .mini-paging span:first-child {
      opacity: 0.8;
    }
    
    .mini-page {
      font-weight: 600;
      margin-top: 2px;
    }

    /* ========== CONTENT GRID ========== */
    .content-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, 1fr);
      gap: 5mm;
      flex: 1;
      min-height: 0;
    }

    /* ========== CARDS ========== */
    .card {
      display: flex;
      flex-direction: column;
      background: #fafbfc;
      border-radius: 12px;
      overflow: hidden;
      page-break-inside: avoid;
      box-shadow: 
        0 1px 3px rgba(0,0,0,0.04),
        0 4px 12px rgba(0,0,0,0.03);
      border: 1px solid #eee;
      position: relative;
    }
    
    .card-empty {
      background: transparent;
      border: 1.5px dashed #ddd;
      box-shadow: none;
    }
    
    .card-accent {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(180deg, var(--primary), var(--secondary));
      border-radius: 4px 0 0 4px;
    }
    
    .card-body {
      padding: 8px 12px 4px 16px;
    }
    
    .card-top {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    }
    
    .card-number {
      width: 24px;
      height: 24px;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: white;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10pt;
      font-weight: 700;
      flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(from var(--primary) r g b / 0.3);
    }
    
    .card-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      min-width: 0;
    }
    
    .card-code {
      font-size: 9pt;
      font-weight: 700;
      color: var(--primary);
      letter-spacing: -0.2px;
    }
    
    .card-badge {
      font-size: 6.5pt;
      font-weight: 600;
      color: white;
      background: linear-gradient(135deg, var(--secondary), var(--primary));
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.3px;
    }
    
    .card-title {
      font-size: 10.5pt;
      font-weight: 700;
      color: #1a1a2e;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      letter-spacing: -0.2px;
    }
    
    .card-desc {
      font-size: 8pt;
      color: #555;
      background: white;
      padding: 6px 8px;
      margin-top: 6px;
      border-radius: 6px;
      line-height: 1.4;
      border-left: 3px solid var(--secondary);
    }

    /* ========== MEDIA ========== */
    .card-media {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: white;
      margin: 4px 6px 6px;
      border-radius: 8px;
      overflow: hidden;
      min-height: 100px;
    }
    
    .card-media img {
      max-width: 100%;
      max-height: 280px;
      height: auto;
      object-fit: contain;
    }
    
    .media-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 24px;
      color: #ccc;
    }
    
    .media-placeholder svg {
      width: 36px;
      height: 36px;
      opacity: 0.5;
    }
    
    .media-placeholder span {
      font-size: 8pt;
      font-weight: 500;
    }
    
    .media-note {
      font-size: 7pt;
      color: #666;
      padding: 5px 10px;
      text-align: center;
      font-style: italic;
      background: #f8f9fa;
      width: 100%;
      border-top: 1px solid #eee;
    }

    /* ========== FOOTER ========== */
    .doc-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 10px;
      border-top: 1px solid #e8e8e8;
      margin-top: auto;
      font-size: 7pt;
      color: #888;
    }
    
    .footer-brand {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .footer-name {
      font-weight: 600;
      color: #666;
    }
    
    .footer-sep {
      color: #ccc;
    }
    
    .footer-desc {
      color: #999;
    }
    
    .footer-paging {
      font-weight: 500;
      color: #666;
    }

    /* ========== PRINT ========== */
    @media print {
      body {
        background: white;
      }
      
      .page {
        margin: 0;
        box-shadow: none;
        page-break-after: always;
      }
      
      .page:last-child {
        page-break-after: auto;
      }
      
      .card {
        page-break-inside: avoid;
      }
      
      .page-break {
        page-break-before: always;
      }
    }
    
    @media screen {
      .page {
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        margin-bottom: 24px;
        border-radius: 4px;
      }
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>
  `;
}
