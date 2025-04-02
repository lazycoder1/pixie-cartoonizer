
import React, { useState } from "react";
import { ZoomIn, Plus, Trash2, Download, Pencil, Loader2 } from "lucide-react";
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
}

interface PhotoDetailViewProps {
  photo: Photo;
}

const PhotoDetailView = ({ photo }: PhotoDetailViewProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editInstructions, setEditInstructions] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingPhotos, setEditingPhotos] = useState<EditingPhoto[]>([]);
  const [selectedEdit, setSelectedEdit] = useState<EditingPhoto | null>(null);
  const [isProcessingDialogOpen, setIsProcessingDialogOpen] = useState(false);

  const handleSubmitEdit = async () => {
    if (!editInstructions.trim()) {
      toast.error("Please enter editing instructions");
      return;
    }

    setIsProcessing(true);
    
    try {
      // This would be where you send the edit instructions to be processed
      // For now, we'll just simulate a successful edit
      const newEdit: EditingPhoto = {
        id: `edit-${Date.now()}`,
        instructions: editInstructions,
        status: "processing"
      };
      
      setEditingPhotos(prev => [newEdit, ...prev]);
      
      toast.success("Photo edit submitted successfully!");
      setIsEditDialogOpen(false);
      setEditInstructions("");
    } catch (error: any) {
      toast.error(`Failed to process edit: ${error.message}`);
      console.error("Error processing edit:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditClick = (editItem: EditingPhoto) => {
    setSelectedEdit(editItem);
    setIsProcessingDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Main photo section */}
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
      
      {/* Horizontal separator */}
      <div className="border-t border-gray-200 my-4"></div>
      
      {/* Edits section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Edits</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Processing edits */}
          {editingPhotos.map((editItem) => (
            <button
              key={editItem.id}
              onClick={() => handleEditClick(editItem)}
              className="aspect-square flex flex-col items-center justify-center bg-muted rounded-md transition-colors border-0 overflow-hidden"
            >
              <div className="flex-grow flex items-center justify-center w-full">
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
              </div>
            </button>
          ))}

          {/* Add new edit button */}
          <button
            onClick={() => setIsEditDialogOpen(true)}
            className="aspect-square flex items-center justify-center bg-muted rounded-md hover:bg-muted/80 transition-colors border-0"
          >
            <Plus className="h-8 w-8 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Edit Instructions Dialog */}
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

      {/* Processing Image Dialog */}
      <Dialog open={isProcessingDialogOpen} onOpenChange={setIsProcessingDialogOpen}>
        <DialogContent className="max-w-md flex flex-col">
          {/* Image area with loading spinner */}
          <div className="aspect-[3/4] bg-muted rounded-lg mb-4 flex items-center justify-center">
            <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
          </div>

          {/* Action buttons */}
          <div className="flex justify-between mb-4">
            <Button variant="outline" size="sm" className="flex items-center">
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
            
            <Button variant="outline" size="sm" className="flex items-center">
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>

          {/* Instruction text with edit button */}
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
