
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ImageUploader from "@/components/ImageUploader";
import Gallery from "@/components/Gallery";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { cartoonizeImage } from "@/services/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface CartoonImage {
  id: string;
  original: string;
  cartoon: string;
  createdAt: Date;
}

const DashboardContent = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [images, setImages] = useState<CartoonImage[]>([]);
  const { user, useCredit } = useAuth();
  const navigate = useNavigate();

  // Redirect non-logged in users to home page
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    // Load saved images from localStorage
    const savedImages = localStorage.getItem("pixie-images");
    if (savedImages) {
      try {
        const parsedImages = JSON.parse(savedImages);
        // Convert string dates back to Date objects
        const processedImages = parsedImages.map((img: any) => ({
          ...img,
          createdAt: new Date(img.createdAt)
        }));
        setImages(processedImages);
      } catch (error) {
        console.error("Failed to parse saved images:", error);
      }
    }
  }, []);

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
  };

  const processImage = async () => {
    if (!selectedImage || !user) return;
    
    // Check if user has credits
    const hasCreditAvailable = await useCredit();
    if (!hasCreditAvailable) {
      return;
    }
    
    try {
      setIsProcessing(true);
      toast.info("Processing your image...");
      
      // In a real app, this would call the backend API
      // For now, we'll use our mock implementation
      const result = await cartoonizeImage(selectedImage);
      
      // Create a new image entry
      const newImage: CartoonImage = {
        id: result.id,
        original: URL.createObjectURL(selectedImage),
        cartoon: result.cartoonUrl,
        createdAt: new Date()
      };
      
      // Add to state
      const updatedImages = [newImage, ...images];
      setImages(updatedImages);
      
      // Save to localStorage
      localStorage.setItem("pixie-images", JSON.stringify(updatedImages));
      
      toast.success("Image cartoonized successfully!");
      
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-purple-dark">
            Your Photo Gallery
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload your images and transform them into beautiful cartoons.
          </p>
        </div>
        
        <ImageUploader 
          onImageSelect={handleImageSelect} 
          selectedImage={selectedImage}
          isProcessing={isProcessing}
          onProcessImage={processImage}
        />
        
        {/* Show user's gallery if they have images */}
        <Gallery images={images} />
      </main>
    </div>
  );
};

// Wrapper component to provide auth context
const Dashboard = () => (
  <AuthProvider>
    <DashboardContent />
  </AuthProvider>
);

export default Dashboard;
