// Collection Helper Functions for OpenAI Image Generation
import fs from 'fs/promises';
import path from 'path';

export interface CollectionImage {
  name: string;
  path: string;
  base64: string;
}

export interface CollectionInfo {
  name: string;
  description: string;
  images: CollectionImage[];
}

/**
 * Load example images from a collection directory
 */
export async function loadCollectionImages(collectionName: string): Promise<CollectionImage[]> {
  try {
    const collectionPath = path.join(process.cwd(), 'public', 'collections', collectionName);
    
    // Check if collection directory exists
    try {
      await fs.access(collectionPath);
    } catch {
      console.warn(`Collection directory not found: ${collectionPath}`);
      return [];
    }

    const files = await fs.readdir(collectionPath);
    
    // Filter for image files only
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file) && 
      !file.startsWith('.') &&
      file.toLowerCase() !== 'readme.md'
    );

    const images: CollectionImage[] = [];

    // Load up to 5 example images to avoid token limits
    const maxImages = Math.min(5, imageFiles.length);
    
    for (let i = 0; i < maxImages; i++) {
      const fileName = imageFiles[i];
      const filePath = path.join(collectionPath, fileName);
      
      try {
        const imageBuffer = await fs.readFile(filePath);
        const base64 = imageBuffer.toString('base64');
        
        images.push({
          name: fileName,
          path: `/collections/${collectionName}/${fileName}`,
          base64: `data:image/jpeg;base64,${base64}`
        });
      } catch (error) {
        console.warn(`Failed to load image ${fileName}:`, error);
      }
    }

    return images;
    
  } catch (error) {
    console.error(`Error loading collection ${collectionName}:`, error);
    return [];
  }
}

/**
 * Get available collection names
 */
export async function getAvailableCollections(): Promise<string[]> {
  try {
    const collectionsPath = path.join(process.cwd(), 'public', 'collections');
    const entries = await fs.readdir(collectionsPath, { withFileTypes: true });
    
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort();
      
  } catch (error) {
    console.error('Error getting available collections:', error);
    return [];
  }
}

/**
 * Load collection info including README if available
 */
export async function getCollectionInfo(collectionName: string): Promise<CollectionInfo | null> {
  try {
    const collectionPath = path.join(process.cwd(), 'public', 'collections', collectionName);
    
    // Check if collection exists
    try {
      await fs.access(collectionPath);
    } catch {
      return null;
    }

    let description = `Images inspired by the ${collectionName} collection style`;
    
    // Try to load README for description
    try {
      const readmePath = path.join(collectionPath, 'README.md');
      const readmeContent = await fs.readFile(readmePath, 'utf-8');
      
      // Extract first line or first paragraph as description
      const lines = readmeContent.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        description = lines[0].replace(/^#+\s*/, '').trim();
      }
    } catch {
      // README not found, use default description
    }

    const images = await loadCollectionImages(collectionName);
    
    return {
      name: collectionName,
      description,
      images
    };
    
  } catch (error) {
    console.error(`Error getting collection info for ${collectionName}:`, error);
    return null;
  }
}

/**
 * Create enhanced prompt with collection context
 */
export function createCollectionEnhancedPrompt(
  originalPrompt: string,
  collectionName: string,
  collectionDescription: string
): string {
  return `${originalPrompt}

Style inspiration: ${collectionDescription}
Collection reference: ${collectionName}

Create an image that captures the essence and artistic style of the ${collectionName} collection while following the original prompt. Maintain consistency with the visual themes, color palettes, and artistic approaches shown in the reference images.`;
}