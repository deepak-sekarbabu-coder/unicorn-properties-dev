"use client";

import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-context';

import { Inter } from 'next/font/google'; // Import Inter from next/font/google

import ServiceWorkerRegister from '@/components/ui/service-worker-register';
import { ToastProvider } from '@/components/ui/toast-provider';

import './globals.css';

// Configure the Inter font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Define a CSS variable for the font
  display: 'swap', // Use swap for better performance
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Preconnect to required origins for performance */}
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://www.gstatic.com" />
        <link rel="preconnect" href="https://firebase.googleapis.com" />
        {/* Removed manual Google Fonts link - now handled by next/font */}
        <link rel="preconnect" href="https://unicorndev-b532a.firebaseapp.com" />
        <link rel="dns-prefetch" href="https://unicorndev-b532a.firebaseapp.com" />
        <link rel="preconnect" href="https://apis.google.com" />
        <link rel="dns-prefetch" href="https://apis.google.com" />
      </head>
      <body className={inter.className}>
        <ServiceWorkerRegister />
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}