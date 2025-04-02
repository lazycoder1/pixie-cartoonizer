
import React, { useState } from "react";
import { ZoomIn, Plus, Trash2, Download, Pencil, Loader2, RefreshCw } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Photo {
  id: string;
  url: string;
  name: string;
  created_at: string;
}

interface EditingPhoto {
  id: string;
  instructions: string;
  status: "processing" | "complete" | "failed";
  editedImageUrl?: string;
  error?: string;
}

interface PhotoDetailViewProps {
  photo: Photo;
}

const PhotoDetailView = ({ photo }: PhotoDetailViewProps) => {
  const { user, useCredit } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editInstructions, setEditInstructions] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingPhotos, setEditingPhotos] = useState<EditingPhoto[]>([]);
  const [selectedEdit, setSelectedEdit] = useState<EditingPhoto | null>(null);
  const [isProcessingDialogOpen, setIsProcessingDialogOpen] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const maxRetries = 3;

  const handleSubmitEdit = async () => {
    if (!user) {
      toast.error("You must be logged in to edit photos");
      return;
    }
    
    if (!editInstructions.trim()) {
      toast.error("Please enter editing instructions");
      return;
    }

    if (!await useCredit()) {
      toast.error("No credits available. Please add credits to your account.");
      return;
    }

    processEdit();
  };

  const processEdit = async (editToRetry?: EditingPhoto) => {
    setIsProcessing(true);
    
    try {
      const editId = editToRetry?.id || `edit-${Date.now()}`;
      const instructions = editToRetry?.instructions || editInstructions;
      
      // If this is a new edit (not a retry), add it to the list
      if (!editToRetry) {
        const newEdit: EditingPhoto = {
          id: editId,
          instructions,
          status: "processing"
        };
        
        setEditingPhotos(prev => [newEdit, ...prev]);
        setIsEditDialogOpen(false);
      } else {
        // If this is a retry, update the status to processing
        setEditingPhotos(prev => 
          prev.map(item => 
            item.id === editId 
              ? { ...item, status: "processing", error: undefined } 
              : item
          )
        );
      }
      
      // Now call the edge function
      const { data, error } = await supabase.functions.invoke('edit-image', {
        body: {
          imageUrl: photo.url,
          prompt: instructions
        }
      });
      
      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      if (data.error) {
        throw new Error(`API error: ${data.error}`);
      }
      
      setEditingPhotos(prev => 
        prev.map(item => 
          item.id === editId
            ? { ...item, status: "complete", editedImageUrl: data.editedImageUrl } 
            : item
        )
      );
      
      toast.success("Photo edited successfully!");
      
      if (!editToRetry) {
        setEditInstructions("");
      }
      
      // Reset retry count on success
      setRetryAttempts(0);
      
    } catch (error: any) {
      const editId = editToRetry?.id || `edit-${Date.now()}`;
      
      setEditingPhotos(prev => 
        prev.map(item => 
          item.id === editId
            ? { ...item, status: "failed", error: error.message } 
            : item
        )
      );
      
      toast.error(`Failed to process edit: ${error.message}`);
      console.error("Error processing edit:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = async (editItem: EditingPhoto) => {
    if (retryAttempts >= maxRetries) {
      toast.error("Maximum retry attempts reached. Please try again later.");
      return;
    }
    
    setRetryAttempts(prev => prev + 1);
    await processEdit(editItem);
  };

  const handleEditClick = (editItem: EditingPhoto) => {
    setSelectedEdit(editItem);
    setIsProcessingDialogOpen(true);
  };

  return (
    <div className="space-y-8">
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
      
      <div className="border-t border-gray-200 my-4"></div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Edits</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {editingPhotos.map((editItem) => (
            <button
              key={editItem.id}
              onClick={() => handleEditClick(editItem)}
              className="aspect-square flex flex-col items-center justify-center bg-muted rounded-md transition-colors border-0 overflow-hidden"
            >
              <div className="flex-grow flex items-center justify-center w-full">
                {editItem.status === "complete" && editItem.editedImageUrl ? (
                  <img 
                    src={editItem.editedImageUrl} 
                    alt={`Edited ${photo.name}`} 
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
            onClick={() => setIsEditDialogOpen(true)}
            className="aspect-square flex items-center justify-center bg-muted rounded-md hover:bg-muted/80 transition-colors border-0"
          >
            <Plus className="h-8 w-8 text-muted-foreground" />
          </button>
        </div>
      </div>

      <AlertDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Photo with AI</AlertDialogTitle>
            <AlertDialogDescription>
              Describe how you want to edit this photo
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <Textarea
            placeholder="E.g., 'Make it look like a watercolor painting', 'Add a sunset background'"
            value={editInstructions}
            onChange={(e) => setEditInstructions(e.target.value)}
            className="min-h-[100px] my-4"
          />
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSubmitEdit}
              disabled={isProcessing || !editInstructions.trim()}
              className={isProcessing ? "opacity-50 cursor-not-allowed" : ""}
            >
              {isProcessing ? "Processing..." : "Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isProcessingDialogOpen} onOpenChange={setIsProcessingDialogOpen}>
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
                  onClick={() => handleRetry(selectedEdit)}
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
            <Button variant="outline" size="sm" className="flex items-center">
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
    </div>
  );
};

export default PhotoDetailView;
