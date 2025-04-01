
import React from "react";
import { Button } from "@/components/ui/button";
import { Ticket, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const { user, profile, credits, isLoading, signIn, signOut } = useAuth();

  return (
    <nav className="w-full py-4 px-6 flex items-center justify-between border-b border-border">
      <div className="flex items-center space-x-2">
        <div className="h-10 w-10 bg-gradient-to-br from-brand-purple to-brand-purple-dark rounded-lg flex items-center justify-center logo">
          <span className="text-white font-bold text-xl">PC</span>
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-brand-purple to-brand-purple-dark bg-clip-text text-transparent">
          PixieCartoon
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <div className="flex items-center bg-secondary rounded-full px-4 py-1.5">
              <Ticket size={18} className="mr-1.5 text-brand-purple" />
              <span className="font-medium">{credits}</span>
            </div>
            <Button 
              variant="ghost"
              className="flex items-center space-x-2 auth-button"
              onClick={signOut}
            >
              <span className="font-medium">{profile?.name || user.email}</span>
              <div className="h-8 w-8 rounded-full bg-brand-purple-light flex items-center justify-center overflow-hidden">
                {profile?.photo_url ? (
                  <img 
                    src={profile.photo_url} 
                    alt={profile?.name || "User"} 
                    className="h-full w-full object-cover" 
                  />
                ) : (
                  <User size={16} className="text-brand-purple" />
                )}
              </div>
            </Button>
          </>
        ) : (
          <Button 
            onClick={signIn}
            disabled={isLoading}
            className="bg-gradient-to-r from-brand-purple to-brand-purple-dark hover:opacity-90 auth-button"
          >
            Sign in with Google
          </Button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
