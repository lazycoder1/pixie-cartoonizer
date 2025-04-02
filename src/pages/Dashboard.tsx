
import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { PhotoUploader } from "@/components/PhotoUploader";
import { PhotoGallery } from "@/components/PhotoGallery";
import { useEffect } from "react";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Redirect non-logged in users to home page
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handlePhotoUploaded = () => {
    // Trigger a refresh of the gallery
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-purple-dark">
            Photo Gallery
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload, view, and manage your photos.
          </p>
        </div>
        
        <PhotoUploader onPhotoUploaded={handlePhotoUploaded} />
        <div className="mt-8">
          <PhotoGallery refreshTrigger={refreshTrigger} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
