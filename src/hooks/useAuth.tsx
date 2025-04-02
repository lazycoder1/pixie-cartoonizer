
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  photo_url: string | null;
  credits: number;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  credits: number;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  addCredits: (amount: number) => Promise<void>;
  useCredit: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch user profile data
  const fetchProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }
      
      if (data) {
        console.log("Profile data retrieved:", data);
        setProfile(data);
      } else {
        console.log("No profile data found for user");
      }
    } catch (error) {
      console.error("Error in fetchProfile:", error);
    }
  };

  // Set up auth state listener
  useEffect(() => {
    console.log("Setting up auth state listener");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.id);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Fetch profile in a separate execution context to avoid recursive update
        if (currentSession?.user) {
          setTimeout(() => {
            fetchProfile(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // Check for existing session
    console.log("Checking for existing session");
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Existing session:", currentSession?.user?.id);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id);
      }
    }).finally(() => {
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    setIsLoading(true);
    try {
      console.log("Attempting to sign in with Google");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) {
        console.error("Sign in error:", error);
        throw error;
      }
      
      console.log("Sign in succeeded, redirecting to:", data?.url);
      // Navigate to the URL provided by Supabase
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Sign in error details:", error);
      toast.error(`Failed to sign in: ${error.message}`);
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success("Successfully signed out");
    } catch (error: any) {
      toast.error(`Failed to sign out: ${error.message}`);
      console.error("Sign out error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addCredits = async (amount: number) => {
    if (!user || !profile) return;
    
    try {
      const newCredits = profile.credits + amount;
      
      const { error } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Update local state
      setProfile(prev => prev ? { ...prev, credits: newCredits } : null);
      
      toast.success(`${amount} credits added to your account!`);
    } catch (error: any) {
      toast.error(`Failed to add credits: ${error.message}`);
      console.error("Error adding credits:", error);
    }
  };

  const useCredit = async () => {
    if (!user || !profile || profile.credits <= 0) {
      if (user) {
        toast.error("No credits available");
      }
      return false;
    }
    
    try {
      const newCredits = profile.credits - 1;
      
      const { error } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Update local state
      setProfile(prev => prev ? { ...prev, credits: newCredits } : null);
      
      return true;
    } catch (error: any) {
      toast.error(`Failed to use credit: ${error.message}`);
      console.error("Error using credit:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      credits: profile?.credits ?? 0, 
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
