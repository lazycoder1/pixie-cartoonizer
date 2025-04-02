
import { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  photo_url: string | null;
  credits: number;
}

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  credits: number;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  addCredits: (amount: number) => Promise<void>;
  useCredit: () => Promise<boolean>;
}
