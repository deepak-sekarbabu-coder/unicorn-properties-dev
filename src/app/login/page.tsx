import Image from 'next/image';

import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center">
          <Image
            src="/unicorn-logo.png"
            alt="Unicorn Properties Logo"
            width={48}
            height={48}
            className="mb-2"
          />
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to Unicorn Properties</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
