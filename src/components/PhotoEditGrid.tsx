
import React from "react";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { EditingPhoto } from "@/types/photo";

interface PhotoEditGridProps {
  editingPhotos: EditingPhoto[];
  isLoading: boolean;
  onEditClick: (editItem: EditingPhoto) => void;
  onAddClick: () => void;
}

const PhotoEditGrid = ({ 
  editingPhotos, 
  isLoading, 
  onEditClick, 
  onAddClick 
}: PhotoEditGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-square bg-muted animate-pulse rounded-md"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {editingPhotos.map((editItem) => (
        <button
          key={editItem.id}
          onClick={() => onEditClick(editItem)}
          className="aspect-square flex flex-col items-center justify-center bg-muted rounded-md transition-colors border-0 overflow-hidden"
        >
          <div className="flex-grow flex items-center justify-center w-full">
            {editItem.status === "complete" && editItem.editedImageUrl ? (
              <img 
                src={editItem.editedImageUrl} 
                alt="Edited photo" 
                className="w-full h-full object-cover"
              />
            ) : editItem.status === "failed" ? (
              <div className="flex flex-col items-center justify-center p-2">
                <RefreshCw className="h-8 w-8 text-destructive mb-2" />
                <span className="text-xs text-center text-muted-foreground">Failed</span>
              </div>
            ) : (
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            )}
          </div>
        </button>
      ))}
      
      <button
        onClick={onAddClick}
        className="aspect-square flex items-center justify-center bg-muted rounded-md hover:bg-muted/80 transition-colors border-0"
      >
        <Plus className="h-8 w-8 text-muted-foreground" />
      </button>
    </div>
  );
};

export default PhotoEditGrid;
