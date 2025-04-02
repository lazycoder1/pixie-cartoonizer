
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import BeforeAfterShowcase from "@/components/BeforeAfterShowcase";
import AuthDebug from "@/components/AuthDebug";

const Index = () => {
  const navigate = useNavigate();
  const { user, signIn, isLoading } = useAuth();

  // If user is already logged in, redirect to dashboard
  React.useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleGetStarted = async () => {
    try {
      await signIn();
      // The redirect will happen in the useEffect when auth state changes
    } catch (error) {
      console.error("Error during sign in:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-16 pb-24 text-center">
        <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-purple-dark">
          Transform Photos into Art
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10">
          Upload your photos and watch them transform into stunning cartoon artwork using the power of AI.
        </p>
        <Button 
          onClick={handleGetStarted} 
          disabled={isLoading}
          size="lg"
          className="bg-gradient-to-r from-brand-purple to-brand-purple-dark hover:opacity-90 text-lg px-10 py-6 h-auto"
        >
          {isLoading ? "Loading..." : "Get Started with Google"}
        </Button>
      </div>

      {/* Showcase Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-purple-dark">
          See the Magic in Action
        </h2>
        <BeforeAfterShowcase />
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16 bg-muted/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-background p-6 rounded-xl shadow-sm">
            <div className="h-12 w-12 rounded-full bg-brand-purple/20 flex items-center justify-center mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-purple"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
            </div>
            <h3 className="text-xl font-semibold text-center mb-2">Easy to Use</h3>
            <p className="text-center text-muted-foreground">Upload your photo and our AI will transform it in seconds</p>
          </div>
          
          <div className="bg-background p-6 rounded-xl shadow-sm">
            <div className="h-12 w-12 rounded-full bg-brand-purple/20 flex items-center justify-center mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-purple"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </div>
            <h3 className="text-xl font-semibold text-center mb-2">High Quality</h3>
            <p className="text-center text-muted-foreground">Advanced AI algorithms ensure beautiful cartoon transformations</p>
          </div>
          
          <div className="bg-background p-6 rounded-xl shadow-sm">
            <div className="h-12 w-12 rounded-full bg-brand-purple/20 flex items-center justify-center mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-purple"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"></path><path d="m6.08 9.5-3.5 1.6a1 1 0 0 0 0 1.81l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9a1 1 0 0 0 0-1.83l-3.5-1.59"></path><path d="m6.08 14.5-3.5 1.6a1 1 0 0 0 0 1.81l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9a1 1 0 0 0 0-1.83l-3.5-1.59"></path></svg>
            </div>
            <h3 className="text-xl font-semibold text-center mb-2">Multiple Styles</h3>
            <p className="text-center text-muted-foreground">Choose from different cartoon styles for your images</p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 text-center">
        <p className="text-sm text-muted-foreground">© 2023 PixieCartoon. All rights reserved.</p>
      </footer>

      {/* Debug component - set show to false to hide */}
      <AuthDebug show={false} />
    </div>
  );
};

export default Index;
