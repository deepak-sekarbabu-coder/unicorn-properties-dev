import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-context';

import type { Metadata } from 'next';

import ServiceWorkerRegister from '@/components/ui/service-worker-register';
import { ToastProvider } from '@/components/ui/toast-provider';

import './globals.css';

export const metadata: Metadata = {
  title: 'Unicorn Properties',
  description: 'Manage and track property expenses seamlessly.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Google Fonts: Inter, font-display: swap for performance */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://unicorndev-b532a.firebaseapp.com" />
        <link rel="dns-prefetch" href="https://unicorndev-b532a.firebaseapp.com" />
        <link rel="preconnect" href="https://apis.google.com" />
        <link rel="dns-prefetch" href="https://apis.google.com" />
        {/*
          Next.js warning: Custom fonts not added in `pages/_document.js` will only load for a single page.
          This is discouraged. See: https://nextjs.org/docs/messages/no-page-custom-font
          In the App Router, use the new `next/font` system for best results.
        */}
      </head>
      <body>
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
