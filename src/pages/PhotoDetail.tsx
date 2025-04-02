
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import PhotoDetailHeader from "@/components/PhotoDetailHeader";
import PhotoDetailView from "@/components/PhotoDetailView";
import RelatedPhotos from "@/components/RelatedPhotos";
import PhotoLoading from "@/components/PhotoLoading";
import PhotoNotFound from "@/components/PhotoNotFound";
import { usePhotoDetail } from "@/hooks/usePhotoDetail";

const PhotoDetail = () => {
  const { photoName } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { photo, relatedPhotos, loading } = usePhotoDetail(user?.id, photoName);

  // Redirect to dashboard if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <PhotoLoading />;
  }

  if (!photo) {
    return <PhotoNotFound />;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="container mx-auto max-w-6xl">
        <PhotoDetailHeader photoName={photoName!} />
        <PhotoDetailView photo={photo} />
        <RelatedPhotos photos={relatedPhotos} />
      </div>
    </div>
  );
};

export default PhotoDetail;
