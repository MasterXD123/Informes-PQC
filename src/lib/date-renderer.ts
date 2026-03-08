// Utility functions for date rendering on images

/**
 * Parse the period string to extract date range
 * Examples: "Del 9 al 15 de febrero de 2026", "DEL 9 AL 15/02/2026", "9-15 febrero 2026"
 */
export function parsePeriodToDates(period: string): { start: Date; end: Date } | null {
  if (!period) return null;
  
  const normalized = period.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Month names in Spanish
  const monthNames: { [key: string]: number } = {
    'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
    'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
    'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
  };
  
  // Try to find year
  const yearMatch = normalized.match(/\b(20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
  
  // Try to find month
  let month = -1;
  for (const [name, num] of Object.entries(monthNames)) {
    if (normalized.includes(name)) {
      month = num;
      break;
    }
  }
  
  // Try format: "del X al Y" or "X al Y" or "X-Y"
  const rangeMatch = normalized.match(/(\d{1,2})\s*(?:al|-|a)\s*(\d{1,2})/);
  
  if (rangeMatch && month >= 0) {
    const startDay = parseInt(rangeMatch[1]);
    const endDay = parseInt(rangeMatch[2]);
    
    return {
      start: new Date(year, month, startDay),
      end: new Date(year, month, endDay, 23, 59, 59)
    };
  }
  
  // Try format with slashes: "X/Y/Z" 
  const slashMatch = normalized.match(/(\d{1,2})\/(\d{1,2})\/?(\d{0,4})/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1]);
    const monthNum = parseInt(slashMatch[2]) - 1;
    const yr = slashMatch[3] ? parseInt(slashMatch[3]) : year;
    
    return {
      start: new Date(yr, monthNum, day),
      end: new Date(yr, monthNum, day, 23, 59, 59)
    };
  }
  
  // Fallback: current week
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7),
    end: now
  };
}

/**
 * Generate a random date within range, between 8:00 AM and 5:00 PM
 */
export function generateRandomDate(start: Date, end: Date): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  
  // Random day within range
  const randomDayTime = startTime + Math.random() * (endTime - startTime);
  const randomDay = new Date(randomDayTime);
  
  // Random time between 8:00 and 17:00 (8 AM to 5 PM)
  const hours = Math.floor(Math.random() * 9) + 8; // 8-16 (8AM-4PM)
  const minutes = Math.floor(Math.random() * 60);
  
  return new Date(
    randomDay.getFullYear(),
    randomDay.getMonth(),
    randomDay.getDate(),
    hours,
    minutes
  );
}

/**
 * Format date in the required format: "13 de febrero de 2026 12:02 p.m."
 */
export function formatDateForRender(date: Date): string {
  const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  
  return `${day} de ${month} de ${year} ${hours}:${minutes} ${ampm}`;
}

/**
 * Render date text on an image using canvas
 * Returns the new image as base64
 * 
 * @param imageBase64 - The image to render on
 * @param dateText - The date text to render
 * @param fontSize - Base font size (will be scaled proportionally)
 * @param showBackground - Whether to show background
 * @param textColor - Text color
 * @param paddingX - Horizontal padding from edges in pixels (default: 30)
 * @param paddingY - Vertical padding from edges in pixels (default: 40)
 */
export async function renderDateOnImage(
  imageBase64: string,
  dateText: string,
  fontSize: number = 28,
  showBackground: boolean = false,
  textColor: string = '#FFFFFF',
  paddingX: number = 30,
  paddingY: number = 40
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Calculate proportional font size based on image dimensions
      // Use the minimum dimension to ensure consistent appearance
      // This makes the text look the same relative size regardless of orientation
      const minDimension = Math.min(img.width, img.height);
      const scaleFactor = minDimension / 800; // 800px is our reference size
      const proportionalFontSize = Math.max(16, Math.round(fontSize * scaleFactor));
      
      // Configure text style with proportional bold font
      const fontFamily = 'Arial, Helvetica, sans-serif';
      ctx.font = `bold ${proportionalFontSize}px ${fontFamily}`;
      
      // Measure text
      const textMetrics = ctx.measureText(dateText);
      const textWidth = textMetrics.width;
      const textHeight = proportionalFontSize;
      
      // Calculate proportional padding
      const proportionalPaddingX = Math.max(10, Math.round(paddingX * scaleFactor));
      const proportionalPaddingY = Math.max(15, Math.round(paddingY * scaleFactor));
      
      // Position at bottom left with proportional padding
      const x = proportionalPaddingX;
      const y = canvas.height - proportionalPaddingY;
      
      // Draw background rectangle only if requested
      if (showBackground) {
        const bgPadding = Math.round(8 * scaleFactor);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(
          x - bgPadding,
          y - textHeight - bgPadding + 4,
          textWidth + bgPadding * 2,
          textHeight + bgPadding * 2
        );
      }
      
      // Draw text shadow for better readability
      const shadowOffset = Math.max(1, Math.round(2 * scaleFactor));
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillText(dateText, x + shadowOffset, y + shadowOffset);
      
      // Draw main text
      ctx.fillStyle = textColor;
      ctx.fillText(dateText, x, y);
      
      // Convert to base64
      const result = canvas.toDataURL('image/jpeg', 0.95);
      resolve(result);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageBase64;
  });
}

/**
 * Generate multiple random dates for batch processing
 */
export function generateMultipleRandomDates(
  count: number,
  start: Date,
  end: Date
): string[] {
  const dates: string[] = [];
  for (let i = 0; i < count; i++) {
    const randomDate = generateRandomDate(start, end);
    dates.push(formatDateForRender(randomDate));
  }
  return dates;
}
