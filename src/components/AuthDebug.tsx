
import React from "react";
import { useAuth } from "@/hooks/useAuth";

const AuthDebug = ({ show = false }) => {
  const { user, isLoading } = useAuth();
  
  if (!show) return null;
  
  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black/80 text-white rounded-lg text-xs z-50 max-w-sm overflow-auto">
      <h5 className="font-bold mb-2">Auth Debug</h5>
      <div className="space-y-1">
        <p><strong>Full URL:</strong> {window.location.href}</p>
        <p><strong>Origin:</strong> {window.location.origin}</p>
        <p><strong>Path:</strong> {window.location.pathname}</p>
        <p><strong>Auth State:</strong> {user ? 'Signed In' : 'Signed Out'}</p>
        <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
        <p className="font-bold mt-2 text-yellow-300">Supabase Settings:</p>
        <p><strong>Site URL:</strong> {window.location.origin}</p>
        <p><strong>Redirect URLs:</strong></p>
        <p className="pl-4">1. {window.location.origin}</p>
        <p className="pl-4">2. {window.location.origin}/</p>
        <p className="pl-4">3. https://id-preview--bb41f734-27f0-41fe-aebd-7511be7f8a0d.lovable.app</p>
        <p className="pl-4">4. https://preview--pixie-cartoonizer.lovable.app</p>
        <p className="font-bold mt-2 text-yellow-300">Google OAuth Settings:</p>
        <p><strong>Authorized JavaScript origins:</strong></p>
        <p className="pl-4">1. {window.location.origin}</p>
        <p className="pl-4">2. https://id-preview--bb41f734-27f0-41fe-aebd-7511be7f8a0d.lovable.app</p>
        <p className="pl-4">3. https://preview--pixie-cartoonizer.lovable.app</p>
        {user && (
          <>
            <p className="font-bold mt-2 text-green-300">User Data:</p>
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthDebug;
