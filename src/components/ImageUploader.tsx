
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Image, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const ImageUploader = ({ onImageSelect }: { onImageSelect: (file: File) => void }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, credits } = useAuth();

  const handleFileSelect = (file: File) => {
    // Check file type
    if (!file.type.match('image.*')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    onImageSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const processImage = async () => {
    if (!selectedImage || !user || credits <= 0) return;
    
    try {
      setIsLoading(true);
      // Process image logic will be implemented in the cartoonize function
      // For now just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Image cartoonized successfully!");
    } catch (error) {
      toast.error("Failed to process image");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-8">
      <div 
        className={`image-upload-container p-8 min-h-[300px] flex flex-col items-center justify-center cursor-pointer transition-all ${isDragging ? 'bg-brand-purple-light' : 'bg-transparent'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!selectedImage ? triggerFileInput : undefined}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileInputChange}
          className="hidden"
          accept="image/*"
        />
        
        {selectedImage ? (
          <div className="w-full relative">
            <img 
              src={selectedImage} 
              alt="Selected" 
              className="max-h-[500px] mx-auto rounded-lg object-contain"
            />
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={() => setSelectedImage(null)} 
                variant="outline" 
                className="mr-2"
              >
                Change Image
              </Button>
              <Button 
                onClick={processImage}
                disabled={isLoading || !user || credits <= 0}
                className="bg-gradient-to-r from-brand-purple to-brand-purple-dark hover:opacity-90 auth-button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Cartoonize Image'
                )}
              </Button>
            </div>
            {!user && (
              <p className="text-center mt-2 text-sm text-muted-foreground">Sign in to cartoonize this image</p>
            )}
            {user && credits <= 0 && (
              <p className="text-center mt-2 text-sm text-destructive">You have no credits left</p>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-brand-purple-light flex items-center justify-center mb-4">
              <Image size={28} className="text-brand-purple" />
            </div>
            <h3 className="text-lg font-medium mb-2">Upload an image</h3>
            <p className="text-muted-foreground mb-4 max-w-md">Drag and drop an image here, or click to select an image to cartoonize</p>
            <Button 
              variant="outline"
              onClick={triggerFileInput}
              className="flex items-center"
            >
              <Upload size={16} className="mr-2" />
              Select Image
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
