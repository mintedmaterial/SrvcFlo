// Cloudflare Zero Trust Authentication Hook
import { useEffect, useState } from 'react';

interface CloudflareUser {
  email: string;
  name: string;
  identity_nonce: string;
  groups?: string[];
  amr?: string[];
  idp?: {
    id: string;
    type: string;
  };
}

interface AuthState {
  user: CloudflareUser | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  permissions: string[];
}

interface UseCloudflareAuthOptions {
  redirectToLogin?: boolean;
  requiredRole?: 'user' | 'admin' | 'premium';
  requiredPermissions?: string[];
}

export function useCloudflareAuth(options: UseCloudflareAuthOptions = {}) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAdmin: false,
    permissions: []
  });

  const {
    redirectToLogin = true,
    requiredRole,
    requiredPermissions = []
  } = options;

  useEffect(() => {
    let mounted = true;

    async function checkAuthentication() {
      try {
        // Check Cloudflare Access JWT
        const response = await fetch('/cdn-cgi/access/get-identity', {
          credentials: 'same-origin'
        });

        if (response.ok) {
          const userData: CloudflareUser = await response.json();
          
          // Get additional user info from our API
          const userInfoResponse = await fetch('/api/auth/user', {
            credentials: 'same-origin',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          let permissions: string[] = [];
          let isAdmin = false;

          if (userInfoResponse.ok) {
            const userInfo = await userInfoResponse.json();
            permissions = userInfo.permissions || [];
            isAdmin = userInfo.role === 'admin';
          }

          if (mounted) {
            setAuthState({
              user: userData,
              loading: false,
              error: null,
              isAdmin,
              permissions
            });
          }
        } else {
          throw new Error('Not authenticated');
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        
        if (mounted) {
          setAuthState({
            user: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Authentication failed',
            isAdmin: false,
            permissions: []
          });

          // Redirect to Cloudflare Access login if required
          if (redirectToLogin && !window.location.pathname.includes('/login')) {
            window.location.href = '/cdn-cgi/access/login';
          }
        }
      }
    }

    checkAuthentication();

    return () => {
      mounted = false;
    };
  }, [redirectToLogin]);

  // Check role and permissions
  const hasRequiredAccess = () => {
    const { user, isAdmin, permissions } = authState;
    
    if (!user) return false;

    // Check required role
    if (requiredRole === 'admin' && !isAdmin) return false;
    if (requiredRole === 'premium' && !permissions.includes('premium_features') && !isAdmin) return false;

    // Check required permissions
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(permission => 
        permissions.includes(permission) || isAdmin
      );
      if (!hasAllPermissions) return false;
    }

    return true;
  };

  const login = () => {
    window.location.href = '/cdn-cgi/access/login';
  };

  const logout = async () => {
    try {
      // Call our logout API first
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin'
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    }

    // Redirect to Cloudflare Access logout
    window.location.href = '/cdn-cgi/access/logout';
  };

  const refreshAuth = async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      const response = await fetch('/cdn-cgi/access/get-identity', {
        credentials: 'same-origin'
      });

      if (response.ok) {
        const userData = await response.json();
        
        const userInfoResponse = await fetch('/api/auth/user', {
          credentials: 'same-origin'
        });

        let permissions: string[] = [];
        let isAdmin = false;

        if (userInfoResponse.ok) {
          const userInfo = await userInfoResponse.json();
          permissions = userInfo.permissions || [];
          isAdmin = userInfo.role === 'admin';
        }

        setAuthState({
          user: userData,
          loading: false,
          error: null,
          isAdmin,
          permissions
        });
      } else {
        throw new Error('Authentication refresh failed');
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Refresh failed'
      }));
    }
  };

  return {
    ...authState,
    hasRequiredAccess: hasRequiredAccess(),
    login,
    logout,
    refreshAuth
  };
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: UseCloudflareAuthOptions = {}
) {
  return function AuthenticatedComponent(props: P) {
    const auth = useCloudflareAuth(options);

    if (auth.loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (auth.error || !auth.user) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Authentication Required
            </h1>
            <p className="text-gray-600 mb-4">
              You need to log in to access this page.
            </p>
            <button
              onClick={auth.login}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Login
            </button>
          </div>
        </div>
      );
    }

    if (!auth.hasRequiredAccess) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <div className="space-x-4">
              <button
                onClick={() => window.history.back()}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Go Back
              </button>
              <button
                onClick={auth.logout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Auth context provider
import { createContext, useContext } from 'react';

const AuthContext = createContext<ReturnType<typeof useCloudflareAuth> | null>(null);

export function AuthProvider({ 
  children, 
  options = {} 
}: { 
  children: React.ReactNode;
  options?: UseCloudflareAuthOptions;
}) {
  const auth = useCloudflareAuth(options);

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Permission checking hooks
export function usePermission(permission: string) {
  const auth = useAuth();
  return auth.permissions.includes(permission) || auth.isAdmin;
}

export function useRole(role: 'user' | 'admin' | 'premium') {
  const auth = useAuth();
  
  switch (role) {
    case 'admin':
      return auth.isAdmin;
    case 'premium':
      return auth.permissions.includes('premium_features') || auth.isAdmin;
    case 'user':
      return auth.user !== null;
    default:
      return false;
  }
}