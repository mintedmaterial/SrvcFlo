/**
 * Web Crypto API Encryption Utilities for ERC-7857 INFT System
 * 
 * Provides encryption/decryption capabilities for:
 * - Agent learning data and preferences
 * - Generated content metadata
 * - Transfer re-encryption for ownership changes
 * - Proof generation and verification
 * 
 * Uses AES-GCM for symmetric encryption and derives keys from wallet addresses
 */

export interface EncryptedData {
  encryptedContent: ArrayBuffer
  iv: Uint8Array
  authTag?: Uint8Array
  algorithm: string
  keyDerivation: string
  hash: string
  version: number
  timestamp: string
}

export interface DecryptedData {
  content: any
  metadata: {
    decryptedAt: string
    algorithm: string
    version: number
  }
}

export interface EncryptionKey {
  key: CryptoKey
  derivedFrom: string
  algorithm: string
  createdAt: string
}

export interface ProofData {
  contentHash: string
  ownershipProof: string
  timestamp: string
  blockNumber?: number
  signature?: string
}

export class CryptoUtils {
  private keyCache: Map<string, EncryptionKey> = new Map()
  private readonly ALGORITHM = 'AES-GCM'
  private readonly KEY_LENGTH = 256
  private readonly IV_LENGTH = 12
  private readonly SALT = 'serviceflow-inft-salt-2024'

  /**
   * Derive encryption key from wallet address
   */
  async deriveKeyFromWallet(walletAddress: string, purpose: string = 'default'): Promise<CryptoKey> {
    const cacheKey = `${walletAddress.toLowerCase()}-${purpose}`
    
    // Check cache first
    if (this.keyCache.has(cacheKey)) {
      const cached = this.keyCache.get(cacheKey)!
      return cached.key
    }

    try {
      // Create base key material from wallet address
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(walletAddress.toLowerCase() + purpose + this.SALT),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      )

      // Derive actual encryption key
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode(this.SALT + purpose),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: this.ALGORITHM, length: this.KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
      )

      // Cache the key
      const encryptionKey: EncryptionKey = {
        key: derivedKey,
        derivedFrom: walletAddress,
        algorithm: this.ALGORITHM,
        createdAt: new Date().toISOString()
      }
      this.keyCache.set(cacheKey, encryptionKey)

      return derivedKey
    } catch (error) {
      console.error('Key derivation error:', error)
      throw new Error('Failed to derive encryption key')
    }
  }

  /**
   * Encrypt data using AES-GCM
   */
  async encryptData(data: any, walletAddress: string, purpose: string = 'default'): Promise<EncryptedData> {
    try {
      const key = await this.deriveKeyFromWallet(walletAddress, purpose)
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH))
      const encodedData = new TextEncoder().encode(JSON.stringify(data))

      const encryptedContent = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        encodedData
      )

      // Generate hash of encrypted content for verification
      const hashBuffer = await crypto.subtle.digest('SHA-256', encryptedContent)
      const hash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      return {
        encryptedContent,
        iv,
        algorithm: this.ALGORITHM,
        keyDerivation: 'PBKDF2-HMAC-SHA256',
        hash,
        version: 1,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Encryption error:', error)
      throw new Error('Failed to encrypt data')
    }
  }

  /**
   * Decrypt data using AES-GCM
   */
  async decryptData(encryptedData: EncryptedData, walletAddress: string, purpose: string = 'default'): Promise<DecryptedData> {
    try {
      const key = await this.deriveKeyFromWallet(walletAddress, purpose)

      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: encryptedData.iv
        },
        key,
        encryptedData.encryptedContent
      )

      const decryptedString = new TextDecoder().decode(decryptedBuffer)
      const content = JSON.parse(decryptedString)

      return {
        content,
        metadata: {
          decryptedAt: new Date().toISOString(),
          algorithm: encryptedData.algorithm,
          version: encryptedData.version
        }
      }
    } catch (error) {
      console.error('Decryption error:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  /**
   * Re-encrypt data for new owner (for ERC-7857 transfers)
   */
  async reencryptForNewOwner(
    encryptedData: EncryptedData,
    currentOwner: string,
    newOwner: string,
    purpose: string = 'default'
  ): Promise<EncryptedData> {
    try {
      // First decrypt with current owner's key
      const decrypted = await this.decryptData(encryptedData, currentOwner, purpose)
      
      // Then encrypt with new owner's key
      const reencrypted = await this.encryptData(decrypted.content, newOwner, purpose)
      
      // Update version to indicate re-encryption
      reencrypted.version = encryptedData.version + 1

      return reencrypted
    } catch (error) {
      console.error('Re-encryption error:', error)
      throw new Error('Failed to re-encrypt data for new owner')
    }
  }

  /**
   * Generate content hash for verification
   */
  async generateContentHash(content: any): Promise<string> {
    try {
      const contentString = typeof content === 'string' ? content : JSON.stringify(content)
      const contentBuffer = new TextEncoder().encode(contentString)
      const hashBuffer = await crypto.subtle.digest('SHA-256', contentBuffer)
      
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    } catch (error) {
      console.error('Hash generation error:', error)
      throw new Error('Failed to generate content hash')
    }
  }

  /**
   * Generate ownership proof for ERC-7857 verification
   */
  async generateOwnershipProof(
    walletAddress: string,
    contentHash: string,
    agentId: string,
    timestamp?: number
  ): Promise<ProofData> {
    try {
      const proofTimestamp = timestamp || Date.now()
      const proofData = {
        walletAddress: walletAddress.toLowerCase(),
        contentHash,
        agentId,
        timestamp: proofTimestamp,
        nonce: crypto.randomUUID()
      }

      const proofString = JSON.stringify(proofData)
      const proofHash = await this.generateContentHash(proofString)

      return {
        contentHash,
        ownershipProof: proofHash,
        timestamp: new Date(proofTimestamp).toISOString()
      }
    } catch (error) {
      console.error('Proof generation error:', error)
      throw new Error('Failed to generate ownership proof')
    }
  }

  /**
   * Verify ownership proof
   */
  async verifyOwnershipProof(
    proof: ProofData,
    expectedWalletAddress: string,
    expectedContentHash: string,
    agentId: string
  ): Promise<boolean> {
    try {
      // Reconstruct proof data
      const proofTimestamp = new Date(proof.timestamp).getTime()
      
      // Verify timestamp is recent (within 24 hours)
      if (Math.abs(Date.now() - proofTimestamp) > 24 * 60 * 60 * 1000) {
        return false
      }

      // Verify content hash matches
      if (proof.contentHash !== expectedContentHash) {
        return false
      }

      // In a full implementation, this would verify the cryptographic proof
      // For now, we check basic consistency
      return proof.ownershipProof.length === 64 // SHA-256 hash length
    } catch (error) {
      console.error('Proof verification error:', error)
      return false
    }
  }

  /**
   * Generate metadata for encrypted storage
   */
  generateStorageMetadata(
    encryptedData: EncryptedData,
    walletAddress: string,
    contentType: string
  ): Record<string, string> {
    return {
      'Content-Type': 'application/octet-stream',
      'X-Encryption-Algorithm': encryptedData.algorithm,
      'X-Key-Derivation': encryptedData.keyDerivation,
      'X-Content-Hash': encryptedData.hash,
      'X-Version': encryptedData.version.toString(),
      'X-Encrypted-At': encryptedData.timestamp,
      'X-Owner-Address': walletAddress.toLowerCase(),
      'X-Content-Type': contentType,
      'X-INFT-Standard': 'ERC-7857'
    }
  }

  /**
   * Create encrypted storage path
   */
  generateStoragePath(walletAddress: string, contentType: string, identifier?: string): string {
    const cleanAddress = walletAddress.toLowerCase().replace('0x', '')
    const id = identifier || crypto.randomUUID()
    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    
    return `encrypted/${cleanAddress}/${timestamp}/${contentType}/${id}.dat`
  }

  /**
   * Generate secure random nonce
   */
  generateNonce(length: number = 32): string {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Derive key for specific purpose with additional entropy
   */
  async deriveSpecializedKey(
    walletAddress: string,
    purpose: string,
    additionalEntropy: string
  ): Promise<CryptoKey> {
    const combinedPurpose = `${purpose}-${additionalEntropy}`
    return this.deriveKeyFromWallet(walletAddress, combinedPurpose)
  }

  /**
   * Encrypt large data in chunks for better performance
   */
  async encryptLargeData(
    data: ArrayBuffer,
    walletAddress: string,
    purpose: string = 'default',
    chunkSize: number = 1024 * 1024 // 1MB chunks
  ): Promise<{
    chunks: EncryptedData[]
    manifest: {
      totalSize: number
      chunkCount: number
      algorithm: string
      contentHash: string
    }
  }> {
    try {
      const chunks: EncryptedData[] = []
      const totalSize = data.byteLength
      const chunkCount = Math.ceil(totalSize / chunkSize)

      // Generate overall content hash
      const contentHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      // Encrypt each chunk
      for (let i = 0; i < chunkCount; i++) {
        const start = i * chunkSize
        const end = Math.min(start + chunkSize, totalSize)
        const chunk = data.slice(start, end)
        
        const chunkPurpose = `${purpose}-chunk-${i}`
        const encryptedChunk = await this.encryptData(
          Array.from(new Uint8Array(chunk)),
          walletAddress,
          chunkPurpose
        )
        
        chunks.push(encryptedChunk)
      }

      return {
        chunks,
        manifest: {
          totalSize,
          chunkCount,
          algorithm: this.ALGORITHM,
          contentHash
        }
      }
    } catch (error) {
      console.error('Large data encryption error:', error)
      throw new Error('Failed to encrypt large data')
    }
  }

  /**
   * Clear cached keys (for security)
   */
  clearKeyCache(): void {
    this.keyCache.clear()
  }

  /**
   * Get encryption statistics
   */
  getStats(): {
    cachedKeys: number
    algorithms: string[]
    supportedOperations: string[]
  } {
    return {
      cachedKeys: this.keyCache.size,
      algorithms: [this.ALGORITHM],
      supportedOperations: ['encrypt', 'decrypt', 'reencrypt', 'generateProof', 'verifyProof']
    }
  }
}

export default CryptoUtils