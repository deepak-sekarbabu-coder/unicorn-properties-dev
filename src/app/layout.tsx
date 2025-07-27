import { AuthProvider } from '@/context/auth-context';

import type { Metadata } from 'next';

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
      <head></head>
      <body className="font-body antialiased">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
