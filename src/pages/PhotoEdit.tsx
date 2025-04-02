
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface Photo {
  id: string;
  url: string;
  name: string;
  created_at: string;
}

interface EditedPhoto {
  id: string;
  originalName: string;
  url: string;
  prompt: string;
  created_at: string;
}

const PhotoEdit = () => {
  const { photoName } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [editedPhotos, setEditedPhotos] = useState<EditedPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user && photoName) {
      fetchPhoto();
      fetchEditedPhotos();
    } else if (!user) {
      navigate("/");
    }
  }, [user, photoName, navigate]);

  const fetchPhoto = async () => {
    if (!user || !photoName) return;
    
    try {
      setLoading(true);
      
      // Get the URL for the main photo
      const { data: url } = supabase.storage
        .from('photos')
        .getPublicUrl(`${user.id}/${photoName}`);
        
      setPhoto({
        id: photoName,
        url: url.publicUrl,
        name: photoName,
        created_at: new Date().toISOString() // We don't have this info from the URL, so using current time
      });
    } catch (error: any) {
      console.error("Error fetching photo:", error);
      toast.error(`Failed to load photo: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchEditedPhotos = async () => {
    // This would normally fetch edited versions of this photo
    // For now, just using a placeholder
    setEditedPhotos([]);
  };

  const handleSubmitPrompt = async () => {
    if (!prompt.trim() || !user || !photo) {
      toast.error("Please enter a valid instruction");
      return;
    }

    setIsProcessing(true);
    
    try {
      // This is where you would integrate with AI image editing
      // For now, we'll just simulate the process
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, we would:
      // 1. Send the image and prompt to a backend service
      // 2. Process the image with AI (like OpenAI's DALL-E or similar)
      // 3. Save the processed image to storage
      // 4. Return the URL to the processed image
      
      // For now, let's just add the original image with the prompt as an edited version
      const newEditedPhoto = {
        id: `edit-${Date.now()}`,
        originalName: photo.name,
        url: photo.url, // Using the same URL for now
        prompt: prompt,
        created_at: new Date().toISOString()
      };
      
      setEditedPhotos(prev => [newEditedPhoto, ...prev]);
      toast.success("Photo edited successfully!");
      setShowPrompt(false);
      setPrompt("");
    } catch (error: any) {
      console.error("Error processing AI edit:", error);
      toast.error(`Failed to process image: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple"></div>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Photo not found</h1>
        <Link to="/dashboard">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <Link to="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Gallery
            </Button>
          </Link>

          <h1 className="text-2xl font-bold">
            {photo.name.split('.').slice(0, -1).join('.')}
          </h1>
        </div>
        
        {/* Main Photo Section */}
        <div className="bg-background rounded-lg shadow-md p-4 mb-8">
          <div className="relative">
            <img 
              src={photo.url} 
              alt={photo.name} 
              className="w-full h-auto rounded-md max-h-[50vh] object-contain mx-auto"
            />
            <div className="mt-4 text-sm text-muted-foreground">
              Uploaded on {new Date(photo.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        {/* AI Edit Controls */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">AI Edited Versions</h2>
          <Button 
            onClick={() => setShowPrompt(!showPrompt)} 
            size="sm"
            variant={showPrompt ? "secondary" : "default"}
            className="flex items-center"
          >
            <Plus size={16} className="mr-1" />
            {showPrompt ? "Cancel" : "New Edit"}
          </Button>
        </div>
        
        {/* Prompt Input */}
        {showPrompt && (
          <div className="bg-muted/50 p-4 rounded-md mb-6">
            <Textarea
              placeholder="Describe how you want to edit this photo (e.g., 'Make it look like a watercolor painting', 'Add a sunset background')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="mb-4"
              rows={3}
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleSubmitPrompt} 
                disabled={isProcessing || !prompt.trim()}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : "Edit Photo"}
              </Button>
            </div>
          </div>
        )}
        
        {/* Edited Photos Gallery */}
        {editedPhotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {editedPhotos.map((editedPhoto) => (
              <Card key={editedPhoto.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-square">
                    <img 
                      src={editedPhoto.url} 
                      alt={`Edited ${photo.name}`} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <p className="text-white text-sm line-clamp-2">
                        {editedPhoto.prompt}
                      </p>
                      <p className="text-white/70 text-xs mt-1">
                        {new Date(editedPhoto.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border-2 border-dashed rounded-lg p-8">
            <ImageIcon className="mx-auto text-muted-foreground mb-4 h-16 w-16" />
            <h3 className="text-lg font-medium mb-2">No edited versions yet</h3>
            <p className="text-muted-foreground mb-4">Create your first AI edit by clicking the "New Edit" button</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoEdit;
