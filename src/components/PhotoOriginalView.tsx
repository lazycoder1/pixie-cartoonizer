
import React from "react";
import { ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Photo } from "@/types/photo";

interface PhotoOriginalViewProps {
  photo: Photo;
}

const PhotoOriginalView = ({ photo }: PhotoOriginalViewProps) => {
  return (
    <div className="bg-background rounded-lg shadow-md p-4 flex justify-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {photo.name.split('.').slice(0, -1).join('.')}
        </h1>
        
        <Dialog>
          <DialogTrigger asChild>
            <div className="relative cursor-zoom-in group mx-auto">
              <img 
                src={photo.url} 
                alt={photo.name} 
                className="w-full h-auto rounded-md max-h-[40vh] object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-background/80 rounded-full p-2">
                  <ZoomIn className="h-6 w-6 text-brand-purple" />
                </div>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] max-h-[90vh] w-auto h-auto p-0 bg-transparent border-0">
            <div className="relative">
              <img 
                src={photo.url} 
                alt={photo.name}
                className="max-w-[90vw] max-h-[90vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Uploaded on {new Date(photo.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default PhotoOriginalView;
