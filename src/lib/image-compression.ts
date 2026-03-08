// Image compression utilities to avoid localStorage quota errors

/**
 * Compress an image (base64) to reduce size
 * @param base64 - The base64 encoded image
 * @param maxWidth - Maximum width (default 1200px)
 * @param quality - JPEG quality 0-1 (default 0.7)
 * @returns Compressed base64 image
 */
export async function compressImage(
  base64: string,
  maxWidth: number = 1200,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      
      // Skip if already small enough
      if (width <= maxWidth && base64.length < 500000) {
        resolve(base64);
        return;
      }
      
      // Scale down if needed
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = Math.round(height * ratio);
      }
      
      // Create canvas and compress
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64);
        return;
      }
      
      // Use white background for JPEG
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to JPEG with compression
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    
    img.onerror = () => {
      // If compression fails, return original
      resolve(base64);
    };
    
    img.src = base64;
  });
}

/**
 * Check if base64 string is too large for localStorage
 */
export function isBase64TooLarge(base64: string): boolean {
  // localStorage typically has 5MB limit
  // Be conservative and check for > 2MB per item
  const sizeInBytes = base64.length * 0.75; // base64 is ~33% larger than binary
  return sizeInBytes > 2 * 1024 * 1024; // 2MB
}

/**
 * Get size of base64 string in MB
 */
export function getBase64SizeMB(base64: string): number {
  return (base64.length * 0.75) / (1024 * 1024);
}

/**
 * Compress if needed to fit within size limits
 */
export async function compressIfNeeded(
  base64: string,
  maxSizeMB: number = 1.5
): Promise<string> {
  const currentSize = getBase64SizeMB(base64);
  
  if (currentSize <= maxSizeMB) {
    return base64;
  }
  
  // Calculate quality needed
  const quality = Math.max(0.3, Math.min(0.8, maxSizeMB / currentSize));
  
  // Also reduce resolution for very large images
  const maxWidth = currentSize > 3 ? 1000 : 1200;
  
  return compressImage(base64, maxWidth, quality);
}

/**
 * Clear old data from localStorage if needed
 */
export function clearOldDataIfNeeded(): void {
  try {
    const keys = Object.keys(localStorage);
    const reportKeys = keys.filter(k => k.startsWith('report-storage'));
    
    // If we have old storage data, try to clear some space
    if (reportKeys.length > 0) {
      const storageData = localStorage.getItem('report-storage');
      if (storageData) {
        try {
          const parsed = JSON.parse(storageData);
          // If items have many images with large base64, clear them
          if (parsed.state?.items) {
            let cleaned = false;
            parsed.state.items = parsed.state.items.map((item: any) => {
              if (item.images && item.images.length > 20) {
                cleaned = true;
                // Keep only last 20 images per item
                return {
                  ...item,
                  images: item.images.slice(-20)
                };
              }
              return item;
            });
            
            if (cleaned) {
              localStorage.setItem('report-storage', JSON.stringify(parsed));
            }
          }
        } catch {
          // If parsing fails, clear the storage
          localStorage.removeItem('report-storage');
        }
      }
    }
  } catch (e) {
    console.warn('Could not clear old data:', e);
  }
}
