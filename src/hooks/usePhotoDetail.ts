
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Photo {
  id: string;
  url: string;
  name: string;
  created_at: string;
}

export const usePhotoDetail = (userId: string | undefined, photoName: string | undefined) => {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [relatedPhotos, setRelatedPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(0); // Add a refresh counter

  useEffect(() => {
    if (userId && photoName) {
      fetchPhoto();
      fetchRelatedPhotos();
    } else {
      // Reset state if no userId or photoName
      setPhoto(null);
      setRelatedPhotos([]);
      setLoading(false);
    }
  }, [userId, photoName, lastRefresh]); // Add lastRefresh to dependencies

  const fetchPhoto = async () => {
    if (!userId || !photoName) return;
    
    try {
      setLoading(true);
      
      // First, check if the photo exists in storage
      const { data: fileData, error: fileError } = await supabase.storage
        .from('photos')
        .list(userId, {
          search: photoName
        });
        
      if (fileError) {
        throw fileError;
      }

      if (!fileData || fileData.length === 0) {
        console.error("Photo not found in storage:", photoName);
        setPhoto(null);
        return;
      }
      
      // Get the file metadata for created_at date
      const fileInfo = fileData[0];
      
      // Get the URL for the main photo
      const { data: url } = supabase.storage
        .from('photos')
        .getPublicUrl(`${userId}/${photoName}`);
        
      setPhoto({
        id: photoName,
        url: url.publicUrl + `?cache=${Date.now()}`, // Add cache-busting query param
        name: photoName,
        created_at: fileInfo.created_at || new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error fetching photo:", error);
      toast.error(`Failed to load photo: ${error.message}`);
      setPhoto(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPhotos = async () => {
    if (!userId) return;
    
    try {
      // List all files in the user's folder
      const { data, error } = await supabase.storage
        .from('photos')
        .list(userId, {
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
                .getPublicUrl(`${userId}/${item.name}`);
                
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

  // Add refresh function
  const refreshPhoto = () => {
    setLastRefresh(Date.now()); // Update the refresh counter to trigger useEffect
  };

  return { photo, relatedPhotos, loading, refreshPhoto };
};
