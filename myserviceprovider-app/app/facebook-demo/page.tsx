"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FacebookLoginButton from "@/components/facebook-login-button";
import FacebookCustomLoginButton from "@/components/facebook-custom-login-button";
import FacebookBusinessData from "@/components/facebook-business-data";

export default function FacebookDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Facebook SDK Demo
            </span>
          </div>
          <nav className="flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
            >
              Back to Home
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Introduction Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Facebook SDK Integration</CardTitle>
              <CardDescription>
                This page demonstrates how to use the Facebook SDK for JavaScript in your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                The Facebook SDK has been integrated into this application. You can use it to:
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Authenticate users with their Facebook accounts</li>
                <li>Access user profile information (with permission)</li>
                <li>Post to Facebook on behalf of users</li>
                <li>Implement Facebook social plugins</li>
                <li>Track app events and analytics</li>
              </ul>
              
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-6">
                <h3 className="font-semibold mb-2">Implementation Details:</h3>
                <p className="text-sm mb-2">
                  1. The Facebook SDK is loaded in the root layout.tsx file
                </p>
                <p className="text-sm mb-2">
                  2. Environment variables are used for the App ID and API version
                </p>
                <p className="text-sm">
                  3. Utility functions are available in lib/facebook.ts
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Login Buttons Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Two Ways to Implement Facebook Login</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Official Facebook Button</CardTitle>
                  <CardDescription>
                    Using the official Facebook XFBML button
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FacebookLoginButton />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Custom Login Button</CardTitle>
                  <CardDescription>
                    Using a custom button with direct SDK calls
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FacebookCustomLoginButton />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Facebook Business Data Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Facebook Business Data</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              This section demonstrates how to fetch and display business data from Facebook using the Graph API.
              Log in with one of the buttons above to see your Facebook business pages, recent posts, and groups.
              This data can be used by agents to find leads and opportunities from Facebook content.
            </p>
            <FacebookBusinessData />
          </div>

          {/* Implementation Code Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Implementation Code</CardTitle>
              <CardDescription>
                How to use the Facebook SDK in your components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-md text-sm font-mono overflow-auto max-h-96">
                <pre>{`// Example usage of Facebook SDK
import {
  loginWithFacebook,
  getFacebookUserData,
  getFacebookUserPosts,
  getFacebookUserAccounts,
  getFacebookProfilePicture,
  getFacebookUserGroups
} from "@/lib/facebook";

// Login with Facebook
const handleLogin = async () => {
  try {
    const response = await loginWithFacebook();
    
    if (response.status === 'connected') {
      // User is logged in
      const userData = await getFacebookUserData();
      console.log("User data:", userData);
      
      // Get user's business pages
      const pages = await getFacebookUserAccounts();
      console.log("Business pages:", pages);
      
      // Get user's recent posts
      const posts = await getFacebookUserPosts();
      console.log("Recent posts:", posts);
      
      // Get user's profile picture
      const picture = await getFacebookProfilePicture(300, 300);
      console.log("Profile picture:", picture);
      
      // Get user's groups
      const groups = await getFacebookUserGroups();
      console.log("Groups:", groups);
    }
  } catch (error) {
    console.error(error);
  }
};

// Render a login button
<button onClick={handleLogin}>
  Login with Facebook
</button>`}</pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 px-4 mt-12">
        <div className="container mx-auto text-center">
          <p className="text-gray-400">
            Make sure to replace the placeholder App ID in your .env file with your actual Facebook App ID.
          </p>
        </div>
      </footer>
    </div>
  );
}