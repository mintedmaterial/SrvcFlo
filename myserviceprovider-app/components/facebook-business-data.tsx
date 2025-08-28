"use client";

import { useState, useEffect } from "react";
import { 
  getFacebookLoginStatus, 
  getFacebookUserAccounts,
  getFacebookUserPosts,
  getFacebookProfilePicture,
  getFacebookUserGroups,
  FacebookStatusResponse
} from "@/lib/facebook";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FacebookPage {
  id: string;
  name: string;
  category?: string;
  access_token?: string;
  tasks?: string[];
}

interface FacebookPost {
  id: string;
  message?: string;
  created_time: string;
}

interface FacebookGroup {
  id: string;
  name: string;
  privacy?: string;
  administrator?: boolean;
}

export default function FacebookBusinessData() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState<FacebookStatusResponse | null>(null);
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [groups, setGroups] = useState<FacebookGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Check login status when component mounts
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const status = await getFacebookLoginStatus();
        setLoginStatus(status);
        
        // If user is connected, fetch data
        if (status.status === 'connected') {
          fetchAllData();
        }
      } catch (error) {
        console.error("Error checking Facebook login status:", error);
        setError("Failed to check login status");
      }
    };

    // Only run on client-side
    if (typeof window !== 'undefined') {
      checkLoginStatus();
    }
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch profile picture
      const pictureData = await getFacebookProfilePicture(300, 300);
      if (pictureData && pictureData.data) {
        setProfilePicture(pictureData.data.url);
      }
      
      // Fetch pages/accounts
      const accountsData = await getFacebookUserAccounts();
      if (accountsData && accountsData.data) {
        setPages(accountsData.data);
      }
      
      // Fetch posts
      const postsData = await getFacebookUserPosts();
      if (postsData && postsData.data) {
        setPosts(postsData.data);
      }
      
      // Fetch groups
      const groupsData = await getFacebookUserGroups();
      if (groupsData && groupsData.data) {
        setGroups(groupsData.data);
      }
    } catch (error) {
      console.error("Error fetching Facebook data:", error);
      setError("Failed to fetch Facebook data. Make sure you have the necessary permissions.");
    } finally {
      setIsLoading(false);
    }
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // If not logged in, show message
  if (loginStatus?.status !== 'connected') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Facebook Business Data</CardTitle>
          <CardDescription>
            Please log in with Facebook to view your business data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-amber-600 dark:text-amber-400">
            You need to be logged in to Facebook to view your business pages and posts.
            Please use one of the login buttons above.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <span>Facebook Business Data</span>
          {isLoading && (
            <div className="ml-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
          )}
        </CardTitle>
        <CardDescription>
          View your Facebook business pages, posts, and groups
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <Tabs defaultValue="pages">
          <TabsList className="mb-4">
            <TabsTrigger value="pages">Business Pages</TabsTrigger>
            <TabsTrigger value="posts">Recent Posts</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
          </TabsList>
          
          {/* Business Pages Tab */}
          <TabsContent value="pages">
            {pages.length > 0 ? (
              <div className="space-y-4">
                {pages.map(page => (
                  <div key={page.id} className="p-4 border rounded-md">
                    <h3 className="text-lg font-semibold">{page.name}</h3>
                    {page.category && <p className="text-sm text-gray-500">Category: {page.category}</p>}
                    <p className="text-sm text-gray-500">ID: {page.id}</p>
                    {page.tasks && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Page Permissions:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {page.tasks.map(task => (
                            <span key={task} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded dark:bg-blue-900/30 dark:text-blue-400">
                              {task}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No business pages found. You may need additional permissions or you don't have any Facebook pages.</p>
            )}
          </TabsContent>
          
          {/* Posts Tab */}
          <TabsContent value="posts">
            {posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map(post => (
                  <div key={post.id} className="p-4 border rounded-md">
                    <div className="flex justify-between">
                      <p className="text-sm text-gray-500">{formatDate(post.created_time)}</p>
                    </div>
                    <p className="mt-2">{post.message || "(No message content)"}</p>
                    <p className="text-xs text-gray-500 mt-2">Post ID: {post.id}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recent posts found. You may need additional permissions or you haven't posted recently.</p>
            )}
          </TabsContent>
          
          {/* Groups Tab */}
          <TabsContent value="groups">
            {groups.length > 0 ? (
              <div className="space-y-4">
                {groups.map(group => (
                  <div key={group.id} className="p-4 border rounded-md">
                    <h3 className="text-lg font-semibold">{group.name}</h3>
                    {group.privacy && <p className="text-sm text-gray-500">Privacy: {group.privacy}</p>}
                    {group.administrator && <p className="text-sm text-blue-600">You are an administrator</p>}
                    <p className="text-sm text-gray-500">ID: {group.id}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No groups found. You may need additional permissions or you're not a member of any groups.</p>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="mt-4">
          <Button 
            onClick={fetchAllData} 
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}