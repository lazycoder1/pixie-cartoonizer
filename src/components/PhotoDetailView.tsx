
import React, { useState } from "react";
import { Photo } from "@/types/photo";
import PhotoOriginalView from "@/components/PhotoOriginalView";
import PhotoEditGrid from "@/components/PhotoEditGrid";
import PhotoEditDialog from "@/components/PhotoEditDialog";
import EditPreviewDialog from "@/components/EditPreviewDialog";
import { usePhotoEdits } from "@/hooks/usePhotoEdits";

interface PhotoDetailViewProps {
  photo: Photo;
}

const PhotoDetailView = ({ photo }: PhotoDetailViewProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProcessingDialogOpen, setIsProcessingDialogOpen] = useState(false);
  const [editInstructions, setEditInstructions] = useState("");
  const [selectedEdit, setSelectedEdit] = useState<any>(null);

  const {
    editingPhotos,
    isLoading,
    isProcessing,
    retryAttempts,
    maxRetries,
    handleSubmitEdit,
    handleRetry,
    handleDeleteEdit
  } = usePhotoEdits(photo);

  const handleEditClick = (editItem: any) => {
    setSelectedEdit(editItem);
    setIsProcessingDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      <PhotoOriginalView photo={photo} />
      
      <div className="border-t border-gray-200 my-4"></div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Edits</h2>
        
        <PhotoEditGrid 
          editingPhotos={editingPhotos}
          isLoading={isLoading}
          onEditClick={handleEditClick}
          onAddClick={() => setIsEditDialogOpen(true)}
        />
      </div>

      <PhotoEditDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editInstructions={editInstructions}
        setEditInstructions={setEditInstructions}
        isProcessing={isProcessing}
        onSubmit={() => {
          handleSubmitEdit(editInstructions);
          setEditInstructions("");
        }}
      />

      <EditPreviewDialog
        isOpen={isProcessingDialogOpen}
        onOpenChange={setIsProcessingDialogOpen}
        selectedEdit={selectedEdit}
        retryAttempts={retryAttempts}
        maxRetries={maxRetries}
        isProcessing={isProcessing}
        onRetry={handleRetry}
        onDelete={(editId) => {
          handleDeleteEdit(editId);
          setIsProcessingDialogOpen(false);
        }}
      />
    </div>
  );
};

export default PhotoDetailView;
