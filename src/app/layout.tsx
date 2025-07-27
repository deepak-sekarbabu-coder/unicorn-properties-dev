import { AuthProvider } from '@/context/auth-context';

import type { Metadata } from 'next';

import { ToastProvider } from '@/components/ui/toast-provider';

import './globals.css';

export const metadata: Metadata = {
  title: 'ApartmentShare',
  description: 'Share and track apartment expenses seamlessly.',
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
