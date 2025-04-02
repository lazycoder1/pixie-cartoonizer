
import React from "react";
import { useAuth } from "@/hooks/useAuth";

const AuthDebug = ({ show = false }) => {
  const { user, isLoading } = useAuth();
  
  if (!show) return null;
  
  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black/80 text-white rounded-lg text-xs z-50 max-w-sm overflow-auto">
      <h5 className="font-bold mb-2">Auth Debug</h5>
      <div className="space-y-1">
        <p><strong>Origin:</strong> {window.location.origin}</p>
        <p><strong>Path:</strong> {window.location.pathname}</p>
        <p><strong>Auth State:</strong> {user ? 'Signed In' : 'Signed Out'}</p>
        <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
        {user && (
          <>
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthDebug;
