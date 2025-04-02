
import React, { useState, useEffect } from "react";
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
  const [isLoading, setIsLoading] = useState(true);
  const maxRetries = 3;

  // Load previously edited photos when component mounts
  useEffect(() => {
    if (user && photo) {
      loadEditedPhotos();
    }
  }, [user, photo]);

  const loadEditedPhotos = async () => {
    if (!user || !photo) return;
    
    setIsLoading(true);
    try {
      // Query for edited photos related to this photo
      const { data, error } = await supabase
        .from('edited_photos')
        .select('*')
        .eq('user_id', user.id)
        .eq('original_photo_id', photo.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // Convert database records to EditingPhoto format
        const loadedEdits: EditingPhoto[] = data.map(edit => ({
          id: edit.id,
          instructions: edit.prompt,
          status: edit.status,
          editedImageUrl: edit.edited_image_url,
          error: edit.error_message
        }));
        
        setEditingPhotos(loadedEdits);
      }
    } catch (error: any) {
      console.error("Error loading edited photos:", error);
      toast.error(`Failed to load edited photos: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

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
    if (!user || !photo) return;
    
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
      
      // First, save the edit request to the database
      let savedEditId: string | undefined;
      
      if (!editToRetry) {
        // Only create a new record if this is not a retry
        const { data: editData, error: editError } = await supabase
          .from('edited_photos')
          .insert({
            user_id: user.id,
            original_photo_id: photo.id,
            prompt: instructions,
            status: 'processing'
          })
          .select('id')
          .single();
          
        if (editError) {
          console.error('Error creating edit record:', editError);
          throw new Error(`Failed to create edit record: ${editError.message}`);
        }
        
        savedEditId = editData.id;
      } else {
        // For retries, update the existing record
        const { error: updateError } = await supabase
          .from('edited_photos')
          .update({ status: 'processing', error_message: null })
          .eq('id', editToRetry.id);
          
        if (updateError) {
          console.error('Error updating edit record:', updateError);
          throw new Error(`Failed to update edit record: ${updateError.message}`);
        }
        
        savedEditId = editToRetry.id;
      }
      
      // Now call the edge function with the database ID
      const { data, error } = await supabase.functions.invoke('edit-image', {
        body: {
          imageUrl: photo.url,
          prompt: instructions,
          userId: user.id,
          photoId: photo.id
        }
      });
      
      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      if (data.error) {
        throw new Error(`API error: ${data.error}`);
      }
      
      // Update our local state
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

  const handleDeleteEdit = async (editId: string) => {
    if (!user) return;
    
    try {
      // Delete from database
      const { error } = await supabase
        .from('edited_photos')
        .delete()
        .eq('id', editId)
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Update UI
      setEditingPhotos(prev => prev.filter(item => item.id !== editId));
      toast.success("Edit deleted successfully");
      setIsProcessingDialogOpen(false);
    } catch (error: any) {
      console.error("Error deleting edit:", error);
      toast.error(`Failed to delete edit: ${error.message}`);
    }
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
        
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-md"></div>
            ))}
          </div>
        ) : (
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
        )}
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
                  onClick={() => selectedEdit && handleRetry(selectedEdit)}
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
              onClick={() => selectedEdit && handleDeleteEdit(selectedEdit.id)}
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
    </div>
  );
};

export default PhotoDetailView;
