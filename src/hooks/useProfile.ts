
import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/auth";
import { toast } from "sonner";

export const useProfile = (user: User | null) => {
  const [profile, setProfile] = useState<Profile | null>(null);

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

  return {
    profile,
    setProfile,
    fetchProfile,
    addCredits,
    useCredit,
  };
};
