
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Photo, EditingPhoto } from "@/types/photo";
import { useAuth } from "@/hooks/useAuth";

export const usePhotoEdits = (photo: Photo | null) => {
  const { user, useCredit } = useAuth();
  const [editingPhotos, setEditingPhotos] = useState<EditingPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const maxRetries = 3;

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
          instructions: edit.prompt || "",
          status: edit.status as "processing" | "complete" | "failed",
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

  const processEdit = async (instructions: string, editToRetry?: EditingPhoto) => {
    if (!user || !photo) return;
    
    setIsProcessing(true);
    
    try {
      const editId = editToRetry?.id || `edit-${Date.now()}`;
      
      // If this is a new edit (not a retry), add it to the list
      if (!editToRetry) {
        const newEdit: EditingPhoto = {
          id: editId,
          instructions,
          status: "processing"
        };
        
        setEditingPhotos(prev => [newEdit, ...prev]);
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

  const handleSubmitEdit = async (editInstructions: string) => {
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

    processEdit(editInstructions);
  };

  const handleRetry = async (editItem: EditingPhoto) => {
    if (retryAttempts >= maxRetries) {
      toast.error("Maximum retry attempts reached. Please try again later.");
      return;
    }
    
    setRetryAttempts(prev => prev + 1);
    await processEdit(editItem.instructions, editItem);
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
    } catch (error: any) {
      console.error("Error deleting edit:", error);
      toast.error(`Failed to delete edit: ${error.message}`);
    }
  };

  return {
    editingPhotos,
    isLoading,
    isProcessing,
    retryAttempts,
    maxRetries,
    handleSubmitEdit,
    handleRetry,
    handleDeleteEdit
  };
};
