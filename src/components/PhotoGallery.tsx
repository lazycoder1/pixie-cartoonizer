
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchPhotos();
    }
  }, [user, refreshTrigger]);

  const fetchPhotos = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase.storage
        .from('photos')
        .list(user.id, {
          sortBy: { column: 'created_at', order: 'desc' }
        });
        
      if (error) {
        throw error;
      }
      
      if (data) {
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

  const handlePhotoClick = (name: string) => {
    navigate(`/photos/${name}`);
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
            <div 
              className="relative aspect-square cursor-pointer"
              onClick={() => handlePhotoClick(photo.name)}
            >
              <img 
                src={photo.url} 
                alt={photo.name} 
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
