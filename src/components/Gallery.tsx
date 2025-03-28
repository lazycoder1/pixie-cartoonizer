
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface GalleryImage {
  id: string;
  original: string;
  cartoon: string;
  createdAt: Date;
}

const Gallery = ({ images }: { images: GalleryImage[] }) => {
  if (images.length === 0) {
    return null;
  }
  
  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-12 mb-16">
      <h2 className="text-2xl font-bold mb-6">Your Cartoonized Images</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <Card key={image.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative group">
                <img 
                  src={image.cartoon} 
                  alt="Cartoonized" 
                  className="w-full h-[220px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                  <div className="p-4 w-full flex justify-between items-center">
                    <p className="text-white font-medium">
                      {image.createdAt.toLocaleDateString()}
                    </p>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => downloadImage(image.cartoon, `cartoon-${image.id}.png`)}
                      className="flex items-center space-x-1"
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
    </div>
  );
};

export default Gallery;
