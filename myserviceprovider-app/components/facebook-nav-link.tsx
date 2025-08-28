"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FacebookNavLink() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  
  return (
    <div className="fixed top-4 right-4 z-50">
      <Link
        href={isHomePage ? "/facebook-demo" : "/"}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
      >
        {isHomePage ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
              <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3 8h-1.35c-.538 0-.65.221-.65.778v1.222h2l-.209 2h-1.791v7h-3v-7h-2v-2h2v-2.308c0-1.769.931-2.692 3.029-2.692h1.971v3z"/>
            </svg>
            <span>Facebook Demo</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
              <path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-6 17h12v-2h-12v2zm0-4h12v-2h-12v2zm0-4h12v-2h-12v2z"/>
            </svg>
            <span>Back to Home</span>
          </>
        )}
      </Link>
    </div>
  );
}