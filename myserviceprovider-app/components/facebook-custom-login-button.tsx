"use client";

import { useState, useEffect } from "react";
import { 
  loginWithFacebook,
  getFacebookUserData,
  getFacebookLoginStatus,
  logoutFromFacebook,
  FacebookStatusResponse
} from "@/lib/facebook";

interface FacebookUser {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    }
  };
}

export default function FacebookCustomLoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState<FacebookStatusResponse | null>(null);
  const [userData, setUserData] = useState<FacebookUser | null>(null);

  // Check login status when component mounts
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const status = await getFacebookLoginStatus();
        setLoginStatus(status);
        
        // If user is connected, get their data
        if (status.status === 'connected') {
          const user = await getFacebookUserData();
          setUserData(user);
        }
      } catch (error) {
        console.error("Error checking Facebook login status:", error);
      }
    };

    // Only run on client-side
    if (typeof window !== 'undefined') {
      checkLoginStatus();
    }
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Request additional permissions for business data
      const response = await loginWithFacebook({
        scope: 'public_profile,email,pages_show_list,pages_read_engagement,groups_access_member_info,user_posts'
      });
      setLoginStatus(response);
      
      if (response.status === 'connected') {
        // User is logged in
        const userData = await getFacebookUserData();
        setUserData(userData);
      }
    } catch (error) {
      console.error("Error logging in with Facebook:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutFromFacebook();
      setLoginStatus({ status: 'unknown' });
      setUserData(null);
    } catch (error) {
      console.error("Error logging out from Facebook:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg">
      <h2 className="text-xl font-bold">Custom Facebook Login</h2>
      
      {loginStatus?.status === 'connected' ? (
        <div className="flex flex-col items-center space-y-3">
          {userData?.picture && (
            <img 
              src={userData.picture.data.url} 
              alt={userData.name} 
              className="w-16 h-16 rounded-full"
            />
          )}
          <div className="text-center">
            <p className="font-medium">{userData?.name}</p>
            {userData?.email && <p className="text-sm text-gray-500">{userData.email}</p>}
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? "Logging out..." : "Logout from Facebook"}
          </button>
        </div>
      ) : (
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3 8h-1.35c-.538 0-.65.221-.65.778v1.222h2l-.209 2h-1.791v7h-3v-7h-2v-2h2v-2.308c0-1.769.931-2.692 3.029-2.692h1.971v3z"/>
          </svg>
          <span>{isLoading ? "Connecting..." : "Login with Facebook"}</span>
        </button>
      )}

      {loginStatus && (
        <div className="mt-4 text-sm">
          <p>Status: <span className="font-semibold">{loginStatus.status}</span></p>
          {loginStatus.status === 'connected' && loginStatus.authResponse && (
            <div className="mt-2">
              <p>User ID: {loginStatus.authResponse.userID}</p>
              <p className="truncate max-w-xs">Access Token: {loginStatus.authResponse.accessToken.substring(0, 20)}...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}