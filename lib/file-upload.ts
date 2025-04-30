// lib/file-upload.ts
import { createBrowserClient } from '@/lib/supabase';

interface UploadOptions {
  file: File;
  userId: string;
  onProgress?: (progress: number) => void;
  folder?: string;
  metadata?: Record<string, string>;
}

interface UploadResult {
  success: boolean;
  id?: string;
  error?: string;
  filePath?: string;
  publicUrl?: string;
}

/**
 * Utility function to handle file uploads to Supabase Storage
 * Used by both CV Manager and Resume Dashboard
 */
export async function uploadFile({
  file,
  userId,
  onProgress,
  folder = 'cvs',
  metadata = {}
}: UploadOptions): Promise<UploadResult> {
  const supabase = createBrowserClient();
  
  // Initialize progress updates if callback provided
  if (onProgress) {
    onProgress(0);
  }
  
  try {
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: "Maximum file size is 5MB"
      };
    }
    
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    
    // Simulate progress updates until actual upload is complete
    let uploadProgress = 0;
    const progressInterval = setInterval(() => {
      uploadProgress += 5;
      if (uploadProgress >= 95) {
        uploadProgress = 95;
        clearInterval(progressInterval);
      }
      if (onProgress) {
        onProgress(uploadProgress);
      }
    }, 100);
    
    // Upload to Supabase Storage with metadata
    const { data, error } = await supabase.storage
      .from(folder)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
        duplex: 'half',
        metadata
      });
    
    // Clear progress timer
    clearInterval(progressInterval);
    
    if (error) {
      throw error;
    }
    
    // Final progress update
    if (onProgress) {
      onProgress(100);
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(folder)
      .getPublicUrl(filePath);
    
    return {
      success: true,
      filePath,
      publicUrl: urlData.publicUrl,
      id: crypto.randomUUID() // Generate a random ID for the upload
    };
  } catch (error: any) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: error.message || 'File upload failed'
    };
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(filePath: string, folder = 'cvs'): Promise<boolean> {
  const supabase = createBrowserClient();
  
  try {
    const { error } = await supabase.storage
      .from(folder)
      .remove([filePath]);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('File deletion error:', error);
    return false;
  }
}