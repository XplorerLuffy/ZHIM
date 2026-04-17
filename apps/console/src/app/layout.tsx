import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '../components/layout/Sidebar';
import { QueryProvider } from '../components/layout/QueryProvider';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Zhim Console',
  description: 'Zhim Superapp — Admin Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-neutral-50`}>
        <QueryProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-hidden flex flex-col">
              {children}
            </main>
          </div>
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
