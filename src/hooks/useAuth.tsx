
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { toast } from "sonner";

interface User {
  uid: string;
  name: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  credits: number;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  addCredits: (amount: number) => void;
  useCredit: () => boolean;
}

// Mock authentication for development - this will be replaced with real Google Auth
const mockUser: User = {
  uid: "mock-user-id",
  name: "Demo User",
  email: "demo@example.com",
  photoURL: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is saved in localStorage (mock auth persistence)
    const savedUser = localStorage.getItem("pixie-user");
    const savedCredits = localStorage.getItem("pixie-credits");
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setCredits(savedCredits ? parseInt(savedCredits, 10) : 3);
    }
    
    setIsLoading(false);
  }, []);

  const signIn = async () => {
    setIsLoading(true);
    try {
      // Mock sign in - to be replaced with actual Google Auth
      // In real implementation, this would be replaced with Firebase/Google Auth
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      setUser(mockUser);
      setCredits(3); // Give new users 3 credits
      
      // Save to localStorage (mock persistence)
      localStorage.setItem("pixie-user", JSON.stringify(mockUser));
      localStorage.setItem("pixie-credits", "3");
      
      toast.success("Successfully signed in!");
    } catch (error) {
      toast.error("Failed to sign in. Please try again.");
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      // Mock sign out
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser(null);
      
      // Clean up localStorage
      localStorage.removeItem("pixie-user");
      
      toast.success("Successfully signed out");
    } catch (error) {
      toast.error("Failed to sign out");
      console.error("Sign out error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addCredits = (amount: number) => {
    const newCredits = credits + amount;
    setCredits(newCredits);
    if (user) {
      localStorage.setItem("pixie-credits", newCredits.toString());
    }
    toast.success(`${amount} credits added to your account!`);
  };

  const useCredit = () => {
    if (!user || credits <= 0) {
      if (user) {
        toast.error("No credits available");
      }
      return false;
    }
    
    const newCredits = credits - 1;
    setCredits(newCredits);
    localStorage.setItem("pixie-credits", newCredits.toString());
    return true;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      credits, 
      isLoading, 
      signIn, 
      signOut,
      addCredits,
      useCredit
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
