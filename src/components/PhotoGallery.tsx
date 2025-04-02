
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Image, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Photo {
  id: string;
  url: string;
  name: string;
  created_at: string;
}

export const PhotoGallery = ({ refreshTrigger }: { refreshTrigger: number }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPhotos();
    }
  }, [user, refreshTrigger]);

  const fetchPhotos = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // List all files in the user's folder
      const { data, error } = await supabase.storage
        .from('photos')
        .list(user.id, {
          sortBy: { column: 'created_at', order: 'desc' }
        });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // Create URL for each photo
        const photoList: Photo[] = await Promise.all(
          data.map(async (item) => {
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
        
        setPhotos(photoList);
      }
    } catch (error: any) {
      console.error("Error fetching photos:", error);
      toast.error(`Failed to load photos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase.storage
        .from('photos')
        .remove([`${user.id}/${name}`]);
        
      if (error) {
        throw error;
      }
      
      toast.success("Photo deleted successfully");
      // Update the list
      setPhotos(photos.filter(photo => photo.name !== name));
    } catch (error: any) {
      console.error("Error deleting photo:", error);
      toast.error(`Delete failed: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <Loader2 className="animate-spin mx-auto text-brand-purple mb-2 h-8 w-8" />
        <p>Loading your photos...</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-10 border-2 border-dashed rounded-lg p-8">
        <Image className="mx-auto text-muted-foreground mb-4 h-16 w-16" />
        <h3 className="text-lg font-medium mb-2">No photos yet</h3>
        <p className="text-muted-foreground mb-4">Upload your first photo to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <Card key={photo.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-square group">
              <img 
                src={photo.url} 
                alt={photo.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                <div className="p-3 w-full flex justify-between items-center">
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDelete(photo.name)}
                    className="flex items-center"
                  >
                    <Trash2 size={14} className="mr-1" />
                    Delete
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = photo.url;
                      link.download = photo.name;
                      link.click();
                    }}
                    className="flex items-center"
                  >
                    <Download size={14} className="mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
