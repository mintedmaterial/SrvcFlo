import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ServiceFlow AI Agent UI",
  description: "Modern chat interface for ServiceFlow AI backend agents",
  keywords: ["AI", "agents", "ServiceFlow", "automation", "chat"],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <Toaster 
            position="top-right"
            richColors
          />
        </ThemeProvider>
      </body>
    </html>
  )
}