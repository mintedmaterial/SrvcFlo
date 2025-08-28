// Development Authentication Hook
import { useEffect, useState } from 'react';

interface DevUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  isAdmin: boolean;
  isMasterAdmin: boolean;
  lastLogin: string;
  createdAt: string;
}

interface AuthState {
  user: DevUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  token: string | null;
  permissions: string[];
}

interface UseDevAuthOptions {
  redirectToLogin?: boolean;
  requiredRole?: 'user' | 'admin' | 'master_admin';
  requiredPermissions?: string[];
}

export function useDevAuth(options: UseDevAuthOptions = {}) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    token: null,
    permissions: []
  });

  const {
    redirectToLogin = false,
    requiredRole,
    requiredPermissions = []
  } = options;

  useEffect(() => {
    let mounted = true;

    async function checkAuthentication() {
      try {
        // Check if we have a token in localStorage
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          throw new Error('No authentication token');
        }

        // Check if token is still valid by calling user info endpoint
        const response = await fetch('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          if (mounted) {
            setAuthState({
              user: data.user,
              loading: false,
              error: null,
              isAuthenticated: true,
              token: token,
              permissions: data.permissions || []
            });
          }
        } else {
          // Token is invalid, remove it
          localStorage.removeItem('auth_token');
          throw new Error('Authentication token invalid');
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        
        if (mounted) {
          setAuthState({
            user: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Authentication failed',
            isAuthenticated: false,
            token: null,
            permissions: []
          });
        }
      }
    }

    checkAuthentication();

    return () => {
      mounted = false;
    };
  }, []);

  // Check role and permissions
  const hasRequiredAccess = () => {
    const { user, permissions } = authState;
    
    if (!user) return false;

    // Check required role
    if (requiredRole === 'admin' && !user.isAdmin) return false;
    if (requiredRole === 'master_admin' && !user.isMasterAdmin) return false;

    // Check required permissions
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(permission => 
        permissions.includes(permission) || user.isAdmin || user.isMasterAdmin
      );
      if (!hasAllPermissions) return false;
    }

    return true;
  };

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store token in localStorage
        localStorage.setItem('auth_token', data.token);
        
        setAuthState({
          user: data.user,
          loading: false,
          error: null,
          isAuthenticated: true,
          token: data.token,
          permissions: [] // Will be loaded on next check
        });

        return { success: true };
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    const token = authState.token;
    
    try {
      if (token) {
        // Call logout API
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    }

    // Clear local storage and state
    localStorage.removeItem('auth_token');
    setAuthState({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      token: null,
      permissions: []
    });
  };

  const refreshAuth = async () => {
    const token = authState.token;
    if (!token) return;

    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        setAuthState(prev => ({
          ...prev,
          user: data.user,
          loading: false,
          error: null,
          permissions: data.permissions || []
        }));
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

// Login component
export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const auth = useDevAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await auth.login(email, password);
    
    if (result.success) {
      onSuccess?.();
    } else {
      setError(result.error || 'Login failed');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to ServiceFlow AI
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Development Environment
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password (any value works in dev)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-sm text-center text-gray-600">
            <p>Development accounts:</p>
            <p><strong>Master Admin:</strong> serviceflowagi@gmail.com</p>
            <p><strong>Regular Admin:</strong> dev-admin@serviceflow.local</p>
            <p><em>Any password works in development mode</em></p>
          </div>
        </form>
      </div>
    </div>
  );
}