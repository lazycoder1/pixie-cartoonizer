
import React from "react";
import { Link } from "react-router-dom";

interface Photo {
  id: string;
  url: string;
  name: string;
  created_at: string;
}

interface RelatedPhotosProps {
  photos: Photo[];
}

const RelatedPhotos = ({ photos }: RelatedPhotosProps) => {
  if (photos.length === 0) return null;
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Other Photos</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {photos.map((relatedPhoto) => (
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
  );
};

export default RelatedPhotos;
