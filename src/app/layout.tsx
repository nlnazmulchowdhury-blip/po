
import type {Metadata} from 'next';
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'CinemaStream - Watch Movies Online',
  description: 'Stream your favorite movies with premium experience',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body 
        className="font-body antialiased selection:bg-primary selection:text-white overflow-x-hidden" 
        suppressHydrationWarning
      >
        <FirebaseClientProvider>
          <SidebarProvider defaultOpen={false}>
            {children}
          </SidebarProvider>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
