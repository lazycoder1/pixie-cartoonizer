
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, RefreshCw, Trash2, Download, Pencil } from "lucide-react";
import { EditingPhoto } from "@/types/photo";

interface EditPreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEdit: EditingPhoto | null;
  retryAttempts: number;
  maxRetries: number;
  isProcessing: boolean;
  onRetry: (edit: EditingPhoto) => void;
  onDelete: (editId: string) => void;
}

const EditPreviewDialog = ({
  isOpen,
  onOpenChange,
  selectedEdit,
  retryAttempts,
  maxRetries,
  isProcessing,
  onRetry,
  onDelete
}: EditPreviewDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md flex flex-col">
        <div className="aspect-[3/4] bg-muted rounded-lg mb-4 flex items-center justify-center">
          {selectedEdit?.status === "complete" && selectedEdit.editedImageUrl ? (
            <img 
              src={selectedEdit.editedImageUrl}
              alt="Edited image" 
              className="w-full h-full object-contain rounded-lg"
            />
          ) : selectedEdit?.status === "failed" ? (
            <div className="flex flex-col items-center justify-center p-4">
              <div className="text-destructive mb-4">Processing failed</div>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                {selectedEdit.error || "An unknown error occurred"}
              </p>
              <Button 
                onClick={() => selectedEdit && onRetry(selectedEdit)}
                disabled={retryAttempts >= maxRetries || isProcessing}
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry ({maxRetries - retryAttempts} attempts left)
              </Button>
            </div>
          ) : (
            <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
          )}
        </div>

        <div className="flex justify-between mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center"
            onClick={() => selectedEdit && onDelete(selectedEdit.id)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center"
            disabled={!(selectedEdit?.status === "complete" && selectedEdit.editedImageUrl)}
            onClick={() => {
              if (selectedEdit?.editedImageUrl) {
                window.open(selectedEdit.editedImageUrl, '_blank');
              }
            }}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>

        <div className="bg-muted rounded-full py-2 px-4 flex justify-between items-center">
          <p className="text-sm truncate mr-2">
            {selectedEdit?.instructions || "Processing your edit..."}
          </p>
          <Button variant="ghost" size="sm" className="flex-shrink-0">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPreviewDialog;
