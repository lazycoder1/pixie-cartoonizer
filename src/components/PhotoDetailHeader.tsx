
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PhotoDetailHeaderProps {
  photoName: string;
}

const PhotoDetailHeader = ({ photoName }: PhotoDetailHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <Link to="/dashboard">
        <Button variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Gallery
        </Button>
      </Link>
    </div>
  );
};

export default PhotoDetailHeader;
