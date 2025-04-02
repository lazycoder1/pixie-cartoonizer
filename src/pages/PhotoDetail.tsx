
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ZoomIn, ZoomOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
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

const PhotoDetail = () => {
  const { photoName } = useParams();
  const { user } = useAuth();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedPhotos, setRelatedPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    if (user && photoName) {
      fetchPhoto();
      fetchRelatedPhotos();
    }
  }, [user, photoName]);

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

  const fetchRelatedPhotos = async () => {
    if (!user) return;
    
    try {
      // List all files in the user's folder
      const { data, error } = await supabase.storage
        .from('photos')
        .list(user.id, {
          sortBy: { column: 'created_at', order: 'desc' },
          limit: 6 // Limit to a reasonable number
        });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // Filter out the current photo and create URLs for the others
        const photoList: Photo[] = await Promise.all(
          data
            .filter(item => item.name !== photoName)
            .slice(0, 5) // Take only 5 related photos
            .map(async (item) => {
              const { data: url } = supabase.storage
                .from('photos')
                .getPublicUrl(`${user.id}/${item.name}`);
                
              return {
                id: item.id || item.name,
                url: url.publicUrl,
                name: item.name,
                created_at: item.created_at
              };
            })
        );
        
        setRelatedPhotos(photoList);
      }
    } catch (error: any) {
      console.error("Error fetching related photos:", error);
      toast.error(`Failed to load related photos: ${error.message}`);
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
      {/* Header with back button */}
      <div className="container mx-auto max-w-6xl">
        <Link to="/dashboard">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Gallery
          </Button>
        </Link>
        
        {/* Main Photo Section */}
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
        
        {/* Related Photos Section */}
        {relatedPhotos.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Other Photos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {relatedPhotos.map((relatedPhoto) => (
                <Link 
                  key={relatedPhoto.id} 
                  to={`/photos/${relatedPhoto.name}`}
                  className="block"
                >
                  <div className="aspect-square rounded-md overflow-hidden bg-muted hover:opacity-90 transition-opacity">
                    <img 
                      src={relatedPhoto.url} 
                      alt={relatedPhoto.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoDetail;
