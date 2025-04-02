
import React from "react";
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

interface PhotoEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editInstructions: string;
  setEditInstructions: (value: string) => void;
  isProcessing: boolean;
  onSubmit: () => void;
}

const PhotoEditDialog = ({
  isOpen,
  onOpenChange,
  editInstructions,
  setEditInstructions,
  isProcessing,
  onSubmit
}: PhotoEditDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
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
            onClick={onSubmit}
            disabled={isProcessing || !editInstructions.trim()}
            className={isProcessing ? "opacity-50 cursor-not-allowed" : ""}
          >
            {isProcessing ? "Processing..." : "Submit"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PhotoEditDialog;
