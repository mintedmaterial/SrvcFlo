import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface R2Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  region?: string;
}

interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
  expires?: Date;
}

interface StorageItem {
  key: string;
  url: string;
  size?: number;
  lastModified?: Date;
  contentType?: string;
  metadata?: Record<string, string>;
}

class R2StorageClient {
  private s3Client: S3Client;
  private bucketName: string;
  private endpoint: string;

  constructor(config: R2Config) {
    this.bucketName = config.bucketName;
    this.endpoint = config.endpoint;

    this.s3Client = new S3Client({
      region: config.region || 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true, // Required for R2
    });
  }

  /**
   * Upload a file to R2 bucket
   */
  async uploadFile(
    key: string,
    file: File | Buffer | Uint8Array,
    options: UploadOptions = {}
  ): Promise<StorageItem> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: options.contentType || this.detectContentType(key),
        Metadata: options.metadata,
        CacheControl: options.cacheControl || 'public, max-age=31536000', // 1 year
        Expires: options.expires,
      });

      await this.s3Client.send(command);

      return {
        key,
        url: this.getPublicUrl(key),
        contentType: options.contentType,
        metadata: options.metadata,
      };
    } catch (error) {
      console.error(`Failed to upload file ${key}:`, error);
      throw error;
    }
  }

  /**
   * Upload image with optimized settings
   */
  async uploadImage(
    key: string,
    imageFile: File | Buffer | Uint8Array,
    options: { quality?: number; format?: 'webp' | 'jpeg' | 'png' } = {}
  ): Promise<StorageItem> {
    const contentType = options.format ? `image/${options.format}` : this.detectContentType(key);

    return this.uploadFile(key, imageFile, {
      contentType,
      cacheControl: 'public, max-age=31536000', // 1 year for images
      metadata: {
        type: 'image',
        quality: options.quality?.toString() || '90',
        format: options.format || 'auto',
        uploadedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Upload video with optimized settings
   */
  async uploadVideo(
    key: string,
    videoFile: File | Buffer | Uint8Array,
    options: { format?: 'mp4' | 'webm' | 'mov'; duration?: number } = {}
  ): Promise<StorageItem> {
    const contentType = options.format ? `video/${options.format}` : this.detectContentType(key);

    return this.uploadFile(key, videoFile, {
      contentType,
      cacheControl: 'public, max-age=31536000', // 1 year for videos
      metadata: {
        type: 'video',
        format: options.format || 'auto',
        duration: options.duration?.toString() || 'unknown',
        uploadedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Generate presigned URL for direct upload from browser
   */
  async generatePresignedUploadUrl(
    key: string,
    options: UploadOptions & { expiresIn?: number } = {}
  ): Promise<{ url: string; fields: Record<string, string> }> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: options.contentType,
        Metadata: options.metadata,
        CacheControl: options.cacheControl,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: options.expiresIn || 3600, // 1 hour
      });

      return {
        url: signedUrl,
        fields: {
          bucket: this.bucketName,
          key,
          'Content-Type': options.contentType || 'application/octet-stream',
        },
      };
    } catch (error) {
      console.error(`Failed to generate presigned URL for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(key: string): Promise<StorageItem | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      return {
        key,
        url: this.getPublicUrl(key),
        size: response.ContentLength,
        lastModified: response.LastModified,
        contentType: response.ContentType,
        metadata: response.Metadata,
      };
    } catch (error) {
      if ((error as any).name === 'NotFound') {
        return null;
      }
      console.error(`Failed to get file info for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete file from bucket
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      console.error(`Failed to delete file ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(key: string): string {
    return `${this.endpoint}/${key}`;
  }

  /**
   * Generate content path for different content types
   */
  generateContentPath(type: 'image' | 'video' | 'audio' | 'document', filename: string): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const uuid = crypto.randomUUID();
    const extension = filename.split('.').pop();

    return `content/${type}/${timestamp}/${uuid}.${extension}`;
  }

  /**
   * Generate user-specific path
   */
  generateUserPath(userId: string, type: 'profile' | 'generated' | 'uploads', filename: string): string {
    const timestamp = Date.now();
    const extension = filename.split('.').pop();

    return `users/${userId}/${type}/${timestamp}.${extension}`;
  }

  /**
   * Detect content type from file extension
   */
  private detectContentType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',

      // Videos
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',

      // Audio
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',

      // Documents
      pdf: 'application/pdf',
      txt: 'text/plain',
      json: 'application/json',
    };

    return mimeTypes[extension || ''] || 'application/octet-stream';
  }
}

// Singleton instance
let r2Client: R2StorageClient | null = null;

export function getR2Client(): R2StorageClient {
  if (!r2Client) {
    const config = {
      endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT || 'https://ff3c5e2beaea9f85fee3200bfe28da16.r2.cloudflarestorage.com',
      accessKeyId: process.env.R2_ACCESS_KEY_ID || 'ff3c5e2beaea9f85fee3200bfe28da16',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      bucketName: process.env.R2_BUCKET_NAME || 'serviceflow-content',
      region: 'auto',
    };

    if (!config.secretAccessKey) {
      throw new Error('R2 secret access key not found. Set R2_SECRET_ACCESS_KEY environment variable.');
    }

    r2Client = new R2StorageClient(config);
  }

  return r2Client;
}

// Helper functions for common operations
export async function uploadGeneratedImage(
  imageFile: File | Buffer | Uint8Array,
  userId: string,
  options: { quality?: number; format?: 'webp' | 'jpeg' | 'png' } = {}
): Promise<StorageItem> {
  const r2 = getR2Client();
  const key = r2.generateUserPath(userId, 'generated', `image.${options.format || 'webp'}`);
  return r2.uploadImage(key, imageFile, options);
}

export async function uploadGeneratedVideo(
  videoFile: File | Buffer | Uint8Array,
  userId: string,
  options: { format?: 'mp4' | 'webm'; duration?: number } = {}
): Promise<StorageItem> {
  const r2 = getR2Client();
  const key = r2.generateUserPath(userId, 'generated', `video.${options.format || 'mp4'}`);
  return r2.uploadVideo(key, videoFile, options);
}

export async function generateImageUploadUrl(
  userId: string,
  format: 'webp' | 'jpeg' | 'png' = 'webp'
): Promise<{ url: string; key: string; fields: Record<string, string> }> {
  const r2 = getR2Client();
  const key = r2.generateUserPath(userId, 'generated', `image.${format}`);
  const presigned = await r2.generatePresignedUploadUrl(key, {
    contentType: `image/${format}`,
    expiresIn: 3600, // 1 hour
    metadata: {
      userId,
      type: 'generated-image',
      uploadedAt: new Date().toISOString(),
    },
  });

  return {
    ...presigned,
    key,
  };
}

export async function generateVideoUploadUrl(
  userId: string,
  format: 'mp4' | 'webm' = 'mp4'
): Promise<{ url: string; key: string; fields: Record<string, string> }> {
  const r2 = getR2Client();
  const key = r2.generateUserPath(userId, 'generated', `video.${format}`);
  const presigned = await r2.generatePresignedUploadUrl(key, {
    contentType: `video/${format}`,
    expiresIn: 3600, // 1 hour
    metadata: {
      userId,
      type: 'generated-video',
      uploadedAt: new Date().toISOString(),
    },
  });

  return {
    ...presigned,
    key,
  };
}

export default R2StorageClient;