import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Link from "next/link"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import FacebookNavLink from "@/components/facebook-nav-link"
import TopNavigation from "@/components/top-navigation"
import { Toaster } from "react-hot-toast"
import dynamic from "next/dynamic"

const WagmiProviderWrapper = dynamic(
  () => import('@/components/wagmi-provider'),
  { 
    ssr: false,
    loading: () => <div>Loading...</div>
  }
)

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ServiceFlow AI - AI-Powered Business Solutions",
  description: "Transform your service business with AI agents for customer service, lead generation, and automation.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <WagmiProviderWrapper>
            <TopNavigation />
            <FacebookNavLink />
            {children}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </WagmiProviderWrapper>
        </ThemeProvider>
        
        {/* Facebook SDK for JavaScript */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.fbAsyncInit = function() {
                FB.init({
                  appId      : '${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ""}',
                  cookie     : true,
                  xfbml      : true,
                  version    : '${process.env.NEXT_PUBLIC_FACEBOOK_API_VERSION || "v19.0"}'
                });
                  
                FB.AppEvents.logPageView();
                  
              };
            
              (function(d, s, id){
                 var js, fjs = d.getElementsByTagName(s)[0];
                 if (d.getElementById(id)) {return;}
                 js = d.createElement(s); js.id = id;
                 js.src = "https://connect.facebook.net/en_US/sdk.js";
                 fjs.parentNode.insertBefore(js, fjs);
               }(document, 'script', 'facebook-jssdk'));
            `,
          }}
        />
      </body>
    </html>
  )
}
