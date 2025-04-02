
import React from "react";
import { ZoomIn } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Photo {
  id: string;
  url: string;
  name: string;
  created_at: string;
}

interface PhotoDetailViewProps {
  photo: Photo;
}

const PhotoDetailView = ({ photo }: PhotoDetailViewProps) => {
  return (
    <div className="bg-background rounded-lg shadow-md p-4 mb-8">
      <h1 className="text-2xl font-bold mb-4">
        {photo.name.split('.').slice(0, -1).join('.')}
      </h1>
      
      {/* Main photo with zoom capability */}
      <Dialog>
        <DialogTrigger asChild>
          <div className="relative cursor-zoom-in group">
            <img 
              src={photo.url} 
              alt={photo.name} 
              className="w-full h-auto rounded-md max-h-[70vh] object-contain mx-auto"
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
      
      <div className="mt-4 text-sm text-muted-foreground">
        Uploaded on {new Date(photo.created_at).toLocaleDateString()}
      </div>
    </div>
  );
};

export default PhotoDetailView;
