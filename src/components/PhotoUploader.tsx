
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { v4 as uuidv4 } from "uuid";

export const PhotoUploader = ({ onPhotoUploaded }: { onPhotoUploaded: () => void }) => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast.error("You must be signed in to upload photos");
      return;
    }
    
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    try {
      setUploading(true);
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      toast.success("Photo uploaded successfully!");
      
      // Clear the input
      e.target.value = '';
      
      // Notify parent component that a new photo was uploaded
      onPhotoUploaded();
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center w-full">
        <label 
          htmlFor="photo-upload"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-brand-purple/30 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-2 text-brand-purple" />
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG, GIF up to 5MB
            </p>
          </div>
          <input 
            id="photo-upload" 
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>
      {uploading && (
        <div className="flex items-center justify-center mt-4">
          <Loader2 className="animate-spin text-brand-purple mr-2" />
          <span>Uploading...</span>
        </div>
      )}
    </div>
  );
};
