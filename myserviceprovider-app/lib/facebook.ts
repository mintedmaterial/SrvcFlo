/**
 * Facebook SDK utility functions
 */

// Types for Facebook SDK responses
export interface FacebookAuthResponse {
  accessToken: string;
  expiresIn: string;
  signedRequest: string;
  userID: string;
}

export interface FacebookStatusResponse {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse?: FacebookAuthResponse;
}

/**
 * Check the login status of the user
 * @returns Promise that resolves to the login status
 */
export const getFacebookLoginStatus = (): Promise<FacebookStatusResponse> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.FB) {
      window.FB.getLoginStatus((response: FacebookStatusResponse) => {
        resolve(response);
      });
    } else {
      resolve({ status: 'unknown' });
    }
  });
};

/**
 * Login to Facebook
 * @param options Optional parameters for FB.login
 * @returns Promise that resolves to the login status
 */
export const loginWithFacebook = (options = { scope: 'public_profile,email' }): Promise<FacebookStatusResponse> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.FB) {
      window.FB.login((response: FacebookStatusResponse) => {
        resolve(response);
      }, options);
    } else {
      resolve({ status: 'unknown' });
    }
  });
};

/**
 * Logout from Facebook
 * @returns Promise that resolves when logout is complete
 */
export const logoutFromFacebook = (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.FB) {
      window.FB.logout(() => {
        resolve();
      });
    } else {
      resolve();
    }
  });
};

/**
 * Get user data from Facebook
 * @param fields Fields to request from Facebook
 * @returns Promise that resolves to the user data
 */
export const getFacebookUserData = (fields = 'id,name,email,picture'): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.FB) {
      window.FB.api('/me', { fields }, (response: any) => {
        if (!response || response.error) {
          reject(response?.error || new Error('Failed to get user data'));
        } else {
          resolve(response);
        }
      });
    } else {
      reject(new Error('Facebook SDK not loaded'));
    }
  });
};

/**
 * Get user's recent posts (limited to 5)
 * @returns Promise that resolves to the user's posts
 */
export const getFacebookUserPosts = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.FB) {
      window.FB.api(
        '/me',
        'GET',
        { fields: 'posts.limit(5){message,created_time,id}' },
        (response: any) => {
          if (!response || response.error) {
            reject(response?.error || new Error('Failed to get user posts'));
          } else {
            resolve(response.posts || { data: [] });
          }
        }
      );
    } else {
      reject(new Error('Facebook SDK not loaded'));
    }
  });
};

/**
 * Get user's Facebook pages/accounts
 * @returns Promise that resolves to the user's accounts
 */
export const getFacebookUserAccounts = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.FB) {
      window.FB.api(
        '/me/accounts',
        'GET',
        {},
        (response: any) => {
          if (!response || response.error) {
            reject(response?.error || new Error('Failed to get user accounts'));
          } else {
            resolve(response);
          }
        }
      );
    } else {
      reject(new Error('Facebook SDK not loaded'));
    }
  });
};

/**
 * Get user's profile picture with specific size
 * @param width Width of the picture
 * @param height Height of the picture
 * @returns Promise that resolves to the user's profile picture data
 */
export const getFacebookProfilePicture = (width = 200, height = 200): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.FB) {
      window.FB.api(
        '/me/picture',
        'GET',
        { redirect: false, width, height },
        (response: any) => {
          if (!response || response.error) {
            reject(response?.error || new Error('Failed to get profile picture'));
          } else {
            resolve(response);
          }
        }
      );
    } else {
      reject(new Error('Facebook SDK not loaded'));
    }
  });
};

/**
 * Get user's groups
 * @returns Promise that resolves to the user's groups
 */
export const getFacebookUserGroups = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.FB) {
      window.FB.api(
        '/me/groups',
        'GET',
        {},
        (response: any) => {
          if (!response || response.error) {
            reject(response?.error || new Error('Failed to get user groups'));
          } else {
            resolve(response);
          }
        }
      );
    } else {
      reject(new Error('Facebook SDK not loaded'));
    }
  });
};

/**
 * Pass the Facebook access token to the MCP server
 * @param accessToken Facebook access token
 * @param expiresIn Token expiration time in seconds
 * @param pageId Optional page ID
 * @returns Promise that resolves to the result of the operation
 */
export const passTokenToMCPServer = (
  accessToken: string,
  expiresIn?: string,
  pageId?: string
): Promise<{ success: boolean; message: string }> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Make a POST request to store the token for the MCP server
      const response = await fetch('/api/facebook/store-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
          expires_in: expiresIn,
          page_id: pageId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to store token');
      }

      const data = await response.json();
      resolve({ success: true, message: data.message || 'Token stored successfully' });
    } catch (error) {
      console.error('Error passing token to MCP server:', error);
      resolve({ success: false, message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
};

/**
 * Get the current Facebook access token and pass it to the MCP server
 * @returns Promise that resolves to the result of the operation
 */
export const syncFacebookTokenWithMCPServer = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Get the current login status
    const status = await getFacebookLoginStatus();
    
    // Check if the user is logged in
    if (status.status !== 'connected' || !status.authResponse) {
      return { success: false, message: 'User not logged in to Facebook' };
    }
    
    // Pass the token to the MCP server
    return await passTokenToMCPServer(
      status.authResponse.accessToken,
      status.authResponse.expiresIn,
      status.authResponse.userID
    );
  } catch (error) {
    console.error('Error syncing Facebook token with MCP server:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Initialize Facebook SDK
 * This is automatically called by the script in layout.tsx
 * but can be called manually if needed
 */
export const initFacebook = (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.FB) {
      resolve();
    } else {
      // Wait for FB SDK to initialize
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
          cookie: true,
          xfbml: true,
          version: process.env.NEXT_PUBLIC_FACEBOOK_API_VERSION || 'v19.0'
        });
        
        window.FB.AppEvents.logPageView();
        resolve();
      };
    }
  });
};

// Add TypeScript declarations for the global window object
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}