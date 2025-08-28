// Local Collection Influence Service
// Replaces PaintSwap integration with local collection image system

import { promises as fs } from 'fs';
import path from 'path';

interface CollectionInfo {
  name: string;
  keywords: string[];
  folderName: string;
  description: string;
}

interface CollectionInfluence {
  collection: string;
  keywords: string[];
  attachedImage?: string; // Base64 image data
  imagePath?: string;
}

// Approved collections with their keywords
const APPROVED_COLLECTIONS: CollectionInfo[] = [
  {
    name: "Derps Collection",
    keywords: ["derp", "derps", "derpy"],
    folderName: "derps",
    description: "Meme-style derpy characters"
  },
  {
    name: "Bandit Kidz",
    keywords: ["kidz", "bandit", "bandit kidz"],
    folderName: "bandit-kidz", 
    description: "Cute bandit-themed kids"
  },
  {
    name: "Razors Collection",
    keywords: ["razor", "razors"],
    folderName: "razors",
    description: "Sharp razor-themed NFTs"
  },
  {
    name: "RTARDS Collection", 
    keywords: ["rtard", "rtards"],
    folderName: "rtards",
    description: "Unique RTARDS collection"
  },
  {
    name: "Lazy Bear",
    keywords: ["lazy", "bear", "lazy bear"],
    folderName: "lazy-bear",
    description: "Relaxed bear characters"
  },
  {
    name: "Beardies",
    keywords: ["beard", "beardies", "beardy"],
    folderName: "beardies", 
    description: "Bearded character collection"
  },
  {
    name: "Goggles.exe",
    keywords: ["goggle", "goggles", "goggles.exe"],
    folderName: "goggles-exe",
    description: "Tech-themed goggle characters"
  },
  {
    name: "Metronix",
    keywords: ["metronix", "metro"],
    folderName: "metronix",
    description: "Futuristic metro-themed collection"
  },
  {
    name: "Whale Collection",
    keywords: ["whale", "whales"],
    folderName: "whale",
    description: "Ocean whale-themed NFTs"
  },
  {
    name: "Pop Skullys",
    keywords: ["skull", "skullys", "pop skull", "pop skullys"],
    folderName: "pop-skullys",
    description: "Pop art skull collection"
  },
  {
    name: "BonkersNFT",
    keywords: ["bonkers", "bonker"],
    folderName: "bonkers-nft",
    description: "Wild and crazy Bonkers collection"
  }
];

class LocalCollectionService {
  private isTestMode: boolean;
  private collectionsBasePath: string;
  private useCloudflareR2: boolean;
  private r2BucketName: string;

  constructor(testMode: boolean = false) {
    this.isTestMode = testMode;
    this.collectionsBasePath = path.join(process.cwd(), 'public', 'collections');
    this.useCloudflareR2 = process.env.NODE_ENV === 'production' && !!process.env.CLOUDFLARE_R2_BUCKET;
    this.r2BucketName = process.env.CLOUDFLARE_R2_BUCKET || 'srvcflo-collections';
  }

  /**
   * Detect collection keywords in prompt and enhance with collection influence
   */
  async enhancePromptWithCollection(
    originalPrompt: string,
    isVideo: boolean = false
  ): Promise<{
    enhancedPrompt: string;
    detectedCollections: string[];
    influence: CollectionInfluence | null;
  }> {
    const lowercasePrompt = originalPrompt.toLowerCase();
    const detectedCollections: CollectionInfo[] = [];

    // Detect collections based on keywords
    for (const collection of APPROVED_COLLECTIONS) {
      const hasKeyword = collection.keywords.some(keyword => 
        lowercasePrompt.includes(keyword.toLowerCase())
      );
      
      if (hasKeyword) {
        detectedCollections.push(collection);
      }
    }

    if (detectedCollections.length === 0) {
      return {
        enhancedPrompt: originalPrompt,
        detectedCollections: [],
        influence: null
      };
    }

    // Use the first detected collection
    const primaryCollection = detectedCollections[0];
    const collectionKeywords = detectedCollections.map(c => c.name);

    // Get a random reference image from the collection
    const referenceImage = await this.getRandomCollectionImage(primaryCollection.folderName);

    // Enhance the prompt with collection style
    const stylePrompt = this.buildCollectionStylePrompt(primaryCollection, isVideo);
    const enhancedPrompt = `${originalPrompt}. ${stylePrompt}`;

    const influence: CollectionInfluence = {
      collection: primaryCollection.name,
      keywords: primaryCollection.keywords,
      attachedImage: referenceImage?.imageData,
      imagePath: referenceImage?.imagePath
    };

    return {
      enhancedPrompt,
      detectedCollections: collectionKeywords,
      influence
    };
  }

  /**
   * Get a random reference image from the collection folder
   */
  private async getRandomCollectionImage(folderName: string): Promise<{
    imageData: string;
    imagePath: string;
  } | null> {
    if (this.isTestMode) {
      // Return mock data in test mode
      return {
        imageData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', // 1x1 transparent pixel
        imagePath: `/collections/${folderName}/mock_image.png`
      };
    }

    if (this.useCloudflareR2) {
      return await this.getRandomCollectionImageFromR2(folderName);
    } else {
      return await this.getRandomCollectionImageFromLocal(folderName);
    }
  }

  /**
   * Get a random reference image from local file system
   */
  private async getRandomCollectionImageFromLocal(folderName: string): Promise<{
    imageData: string;
    imagePath: string;
  } | null> {
    try {
      const collectionPath = path.join(this.collectionsBasePath, folderName);
      
      // Check if folder exists
      try {
        await fs.access(collectionPath);
      } catch {
        console.log(`Collection folder not found: ${collectionPath}`);
        return null;
      }

      // Read all files in the collection folder
      const files = await fs.readdir(collectionPath);
      const imageFiles = files.filter(file => 
        /\.(png|jpg|jpeg|gif|webp)$/i.test(file) && 
        !file.startsWith('README')
      );

      if (imageFiles.length === 0) {
        console.log(`No images found in collection folder: ${folderName}`);
        return null;
      }

      // Select a random image
      const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
      const imagePath = path.join(collectionPath, randomImage);
      
      // Read and convert to base64
      const imageBuffer = await fs.readFile(imagePath);
      const imageData = imageBuffer.toString('base64');

      return {
        imageData,
        imagePath: `/collections/${folderName}/${randomImage}`
      };

    } catch (error) {
      console.error(`Error loading collection image for ${folderName}:`, error);
      return null;
    }
  }

  /**
   * Get a random reference image from Cloudflare R2 bucket
   */
  private async getRandomCollectionImageFromR2(folderName: string): Promise<{
    imageData: string;
    imagePath: string;
  } | null> {
    try {
      // This would integrate with Cloudflare R2 SDK
      // For now, return a placeholder implementation
      console.log(`R2 integration not yet implemented for collection: ${folderName}`);
      
      // TODO: Implement R2 integration when ready for production
      // - List objects in bucket with prefix `collections/${folderName}/`
      // - Filter for image files
      // - Select random image
      // - Download and return base64 data
      
      return null;
    } catch (error) {
      console.error(`Error loading collection image from R2 for ${folderName}:`, error);
      return null;
    }
  }

  /**
   * Build collection-specific style prompt
   */
  private buildCollectionStylePrompt(collection: CollectionInfo, isVideo: boolean): string {
    const baseStyle = `Inspired by ${collection.name} NFT collection style, ${collection.description.toLowerCase()}`;
    
    if (isVideo) {
      return `${baseStyle}, animated with smooth transitions and dynamic movement`;
    } else {
      return `${baseStyle}, highly detailed digital art`;
    }
  }

  /**
   * Get all supported collections info
   */
  getSupportedCollections(): CollectionInfo[] {
    return APPROVED_COLLECTIONS;
  }

  /**
   * Check if a prompt contains any collection keywords
   */
  hasCollectionKeywords(prompt: string): boolean {
    const lowercasePrompt = prompt.toLowerCase();
    return APPROVED_COLLECTIONS.some(collection =>
      collection.keywords.some(keyword => 
        lowercasePrompt.includes(keyword.toLowerCase())
      )
    );
  }
}

// Factory functions
export function createLocalCollectionService(testMode: boolean = false): LocalCollectionService {
  return new LocalCollectionService(testMode);
}

export function createTestLocalCollectionService(): LocalCollectionService {
  return new LocalCollectionService(true);
}

// Legacy compatibility - replace PaintSwap functions
export const createPaintSwapIntegration = createLocalCollectionService;
export const createTestPaintSwapIntegration = createTestLocalCollectionService;

export { LocalCollectionService, CollectionInfo, CollectionInfluence, APPROVED_COLLECTIONS };