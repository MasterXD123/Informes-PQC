import { NextRequest, NextResponse } from 'next/server';
import { ReportItem } from '@/lib/store';
import { useConfigStore, CompanyConfig } from '@/lib/config-store';

interface ExportRequest {
  title: string;
  subtitle: string;
  client: string;
  period: string;
  items: ReportItem[];
  company: CompanyConfig;
}

// Generate PDF as HTML that can be converted to PDF
function generatePdfHtml(data: ExportRequest): string {
  const activeItems = data.items.filter(item => item.isActive);
  const total = activeItems.reduce((sum, item) => sum + item.costo, 0);
  const company = data.company;

  // Group items and their images for page layout (max 4 images per page)
  interface ImageGroup {
    itemIndex: number;
    item: ReportItem;
    imageIndex: number;
    image: typeof item.images[0];
  }

  const allImages: ImageGroup[] = [];
  activeItems.forEach((item, itemIndex) => {
    item.images.filter(img => img.includeInPdf).forEach((image, imageIndex) => {
      allImages.push({ itemIndex, item, imageIndex, image });
    });
  });

  // Generate items HTML (simplified structure)
  const itemsHtml = activeItems.map((item, index) => `
    <div class="item-section">
      <div class="item-header">
        <span class="item-number">${index + 1}</span>
        <span class="item-code">${item.codigo}</span>
      </div>
      <h3 class="item-title">${item.titulo}</h3>
      ${item.descripcion ? `<p class="item-description">${item.descripcion}</p>` : ''}
      ${item.images.filter(img => img.includeInPdf).length > 0 ? `
        <div class="item-images-count">
          📎 ${item.images.filter(img => img.includeInPdf).length} imagen(es) adjunta(s)
        </div>
      ` : ''}
    </div>
  `).join('');

  // Generate images pages (max 4 per page)
  let imagesPagesHtml = '';
  const totalPages = Math.ceil(allImages.length / 4);

  for (let page = 0; page < totalPages; page++) {
    const pageImages = allImages.slice(page * 4, (page + 1) * 4);
    const layoutClass = getLayoutClass(pageImages.length);

    const imagesHtml = pageImages.map(({ item, image }) => `
      <div class="image-item">
        <img src="${image.file}" 
             alt="${image.note || item.titulo}" 
             style="transform: rotate(${image.rotation}deg); 
                    filter: brightness(${image.brightness}%) contrast(${image.contrast}%);" />
        ${image.note ? `<p class="image-caption">${image.note}</p>` : ''}
        <p class="image-source">${item.codigo} - ${item.titulo}</p>
      </div>
    `).join('');

    imagesPagesHtml += `
      <div class="images-page">
        <div class="images-header">
          <span>${company.name}</span>
          <span>Página de imágenes ${page + 1} de ${totalPages}</span>
        </div>
        <div class="images-grid ${layoutClass}">
          ${imagesHtml}
        </div>
      </div>
    `;
  }

  // Convert hex to RGB for styling
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 30, g: 58, b: 95 };
  };

  const primaryColor = hexToRgb(company.primaryColor);
  const secondaryColor = hexToRgb(company.secondaryColor);
  const textColor = hexToRgb(company.textColor);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <style>
    @page {
      size: A4;
      margin: 1.5cm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: rgb(${textColor.r}, ${textColor.g}, ${textColor.b});
      background: white;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 15px;
      border-bottom: 3px solid rgb(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b});
      margin-bottom: 20px;
    }
    
    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .logo {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, rgb(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}) 0%, rgb(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b}) 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 10px;
    }
    
    .logo img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    
    .company-name {
      font-size: 16pt;
      font-weight: 700;
      color: rgb(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b});
      letter-spacing: 1px;
    }
    
    .company-subtitle {
      font-size: 8pt;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .report-info {
      text-align: right;
    }
    
    .report-title {
      font-size: 12pt;
      font-weight: 600;
      color: rgb(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b});
    }
    
    .report-subtitle {
      font-size: 10pt;
      color: #666;
      margin-top: 2px;
    }
    
    .metadata-section {
      display: flex;
      justify-content: space-between;
      background: #f8fafc;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 20px;
      border-left: 4px solid rgb(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b});
    }
    
    .metadata-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .metadata-label {
      font-size: 8pt;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .metadata-value {
      font-size: 10pt;
      font-weight: 600;
    }
    
    .item-section {
      margin-bottom: 15px;
      padding: 12px;
      background: #fafafa;
      border-radius: 6px;
      border-left: 3px solid rgb(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b});
    }
    
    .item-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    
    .item-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      background: rgb(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b});
      color: white;
      border-radius: 50%;
      font-size: 10pt;
      font-weight: 600;
    }
    
    .item-code {
      font-size: 10pt;
      font-weight: 600;
      color: rgb(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b});
    }
    
    .item-title {
      font-size: 11pt;
      font-weight: 500;
      margin-bottom: 6px;
    }
    
    .item-description {
      font-size: 9pt;
      color: #555;
      font-style: italic;
      background: white;
      padding: 8px 10px;
      border-radius: 4px;
      margin-top: 8px;
    }
    
    .item-images-count {
      font-size: 8pt;
      color: #888;
      margin-top: 8px;
    }
    
    .total-section {
      display: flex;
      justify-content: flex-end;
      padding: 15px;
      background: linear-gradient(135deg, rgb(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}) 0%, rgb(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b}) 100%);
      border-radius: 6px;
      margin-top: 20px;
    }
    
    .total-box {
      text-align: right;
      color: white;
    }
    
    .total-label {
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 4px;
    }
    
    .total-amount {
      font-size: 18pt;
      font-weight: 700;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 8pt;
      color: #666;
    }
    
    /* Images Pages */
    .images-page {
      page-break-before: always;
      padding: 0;
    }
    
    .images-header {
      display: flex;
      justify-content: space-between;
      padding-bottom: 10px;
      border-bottom: 2px solid rgb(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b});
      margin-bottom: 15px;
      font-size: 9pt;
      color: #666;
    }
    
    .images-grid {
      display: grid;
      gap: 15px;
    }
    
    .images-grid.grid-1 { grid-template-columns: 1fr; }
    .images-grid.grid-2 { grid-template-columns: 1fr 1fr; }
    .images-grid.grid-3 { grid-template-columns: 1fr 1fr; }
    .images-grid.grid-4 { grid-template-columns: 1fr 1fr; }
    
    .image-item {
      background: #fafafa;
      border-radius: 6px;
      padding: 10px;
      text-align: center;
    }
    
    .image-item img {
      max-width: 100%;
      max-height: 280px;
      object-fit: contain;
      border-radius: 4px;
    }
    
    .image-caption {
      font-size: 8pt;
      color: #666;
      margin-top: 6px;
      font-style: italic;
    }
    
    .image-source {
      font-size: 7pt;
      color: #999;
      margin-top: 4px;
    }
    
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .item-section {
        page-break-inside: avoid;
      }
      
      .images-page {
        page-break-before: always;
      }
      
      .images-grid {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <div class="logo">
        ${company.logo ? `<img src="${company.logo}" alt="${company.name}" />` : company.name.substring(0, 2).toUpperCase()}
      </div>
      <div>
        <div class="company-name">${company.name}</div>
        <div class="company-subtitle">Estructuras Metálicas</div>
      </div>
    </div>
    <div class="report-info">
      <div class="report-title">${data.title}</div>
      ${data.subtitle ? `<div class="report-subtitle">${data.subtitle}</div>` : ''}
    </div>
  </div>
  
  <div class="metadata-section">
    <div class="metadata-item">
      <span class="metadata-label">Cliente</span>
      <span class="metadata-value">${data.client}</span>
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Período</span>
      <span class="metadata-value">${data.period}</span>
    </div>
  </div>
  
  ${itemsHtml}
  
  <div class="total-section">
    <div class="total-box">
      <div class="total-label">Total General</div>
      <div class="total-amount">S/. ${total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
    </div>
  </div>
  
  <div class="footer">
    <p>${company.name}</p>
  </div>
  
  ${imagesPagesHtml}
</body>
</html>
  `;
}

function getLayoutClass(count: number): string {
  switch (count) {
    case 1: return 'grid-1';
    case 2: return 'grid-2';
    case 3: return 'grid-3';
    case 4: return 'grid-4';
    default: return 'grid-4';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json();

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'No items to export' },
        { status: 400 }
      );
    }

    // Generate HTML content
    const htmlContent = generatePdfHtml(body);

    // Return as downloadable HTML with PDF print instructions
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="informe-obra.html"`
      }
    });

  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Failed to export', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
