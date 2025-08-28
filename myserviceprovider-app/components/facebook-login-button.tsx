"use client";

import { useState, useEffect } from "react";
import {
  getFacebookUserData,
  FacebookStatusResponse
} from "@/lib/facebook";

// Extend Window interface to include our custom properties
declare global {
  interface Window {
    statusChangeCallback?: (response: FacebookStatusResponse) => void;
  }
}

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

export default function FacebookLoginButton() {
  const [loginStatus, setLoginStatus] = useState<FacebookStatusResponse | null>(null);
  const [userData, setUserData] = useState<FacebookUser | null>(null);

  // Function to handle the login status change
  const statusChangeCallback = (response: FacebookStatusResponse) => {
    console.log('Facebook login status changed:', response);
    setLoginStatus(response);
    
    if (response.status === 'connected') {
      fetchUserData();
    } else {
      setUserData(null);
    }
  };

  // Function to check login state
  const checkLoginState = () => {
    if (typeof window !== 'undefined' && window.FB) {
      window.FB.getLoginStatus((response: FacebookStatusResponse) => {
        statusChangeCallback(response);
      });
    }
  };

  // Fetch user data when connected
  const fetchUserData = async () => {
    try {
      const user = await getFacebookUserData();
      setUserData(user);
    } catch (error) {
      console.error("Error fetching Facebook user data:", error);
    }
  };

  // Initialize the component
  useEffect(() => {
    // Set up event listener for FB SDK loaded
    const handleFBInit = () => {
      // Parse XFBML tags
      if (typeof window !== 'undefined' && window.FB) {
        window.FB.XFBML.parse(document.getElementById('fb-login-container'));
      }
      checkLoginState();
    };

    // Check if FB SDK is already loaded
    if (typeof window !== 'undefined' && window.FB) {
      handleFBInit();
    } else {
      // Set up event listener for when FB SDK loads
      const originalFBAsyncInit = window.fbAsyncInit;
      window.fbAsyncInit = function() {
        // Call the original fbAsyncInit if it exists
        if (originalFBAsyncInit) {
          originalFBAsyncInit();
        }
        handleFBInit();
      };
    }

    // Cleanup function
    return () => {
      // Restore original fbAsyncInit if component unmounts
      if (typeof window !== 'undefined') {
        delete window.statusChangeCallback;
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg">
      <h2 className="text-xl font-bold">Facebook Authentication</h2>
      
      {/* Official Facebook Login Button using XFBML */}
      <div id="fb-login-container">
        <div
          className="fb-login-button"
          data-width=""
          data-size="large"
          data-button-type="continue_with"
          data-layout="default"
          data-auto-logout-link="true"
          data-use-continue-as="true"
          data-onlogin="checkLoginState">
        </div>
      </div>
      
      {/* Display user info when logged in */}
      {loginStatus?.status === 'connected' && userData && (
        <div className="flex flex-col items-center space-y-3 mt-4">
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
        </div>
      )}

      {/* Display login status */}
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
      
            {/* Add global function for the Facebook button to call */}
            <script dangerouslySetInnerHTML={{
              __html: `
                function checkLoginState() {
                  if (typeof window !== 'undefined' && window.FB) {
                    FB.getLoginStatus(function(response) {
                      // Find the React component's handler and call it
                      if (window.statusChangeCallback) {
                        window.statusChangeCallback(response);
                      }
                    });
                  }
                }
                // Expose the status change callback globally so the FB button can access it
                window.statusChangeCallback = ${statusChangeCallback.toString()};
              `
            }} />
    </div>
  );
}