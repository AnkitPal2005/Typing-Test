import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/components/AuthProvider';
import Link from 'next/link';
import { Headers } from './Headers';

export const metadata: Metadata = {
  title: 'WottaCore - Typing Speed Test',
  description: 'A professional minimalist typing speed test application inspired by Monkeytype.',
  openGraph: {
    title: 'WottaCore Typing Speed Test',
    description: 'A professional minimalist typing speed test application inspired by Monkeytype.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <ThemeProvider>
            <Headers />
            <main className="flex-grow container mx-auto max-w-4xl px-4 py-10">
              {children}
            </main>
            <Footer />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

// Separate Footer component
function Footer() {
  const themes = [
    { name: 'dark', color: '#e2b714' },
    { name: 'light', color: '#d1515a' },
    { name: 'matrix', color: '#15ff00' },
    { name: 'hacker', color: '#00ff66' },
    { name: 'dracula', color: '#ff79c6' },
  ];

  return (
    <footer className="border-t border-[var(--sub-alt-color)] py-8 mt-auto">
      <div className="container mx-auto max-w-4xl px-4 text-center text-[var(--sub-color)]">
        <p className="text-sm">&copy; 2026 - WottaCore Typing Speed Test</p>
        <div className="flex justify-center items-center gap-2 mt-4 flex-wrap">
          <span className="text-xs mr-2">themes:</span>
          {themes.map((t) => (
            <ThemeDot key={t.name} name={t.name} color={t.color} />
          ))}
        </div>
      </div>
    </footer>
  );
}

// Client theme switcher dot
import { ThemeSelectorDot } from '@/components/ThemeSelectorDot';
function ThemeDot({ name, color }: { name: string; color: string }) {
  return <ThemeSelectorDot name={name} color={color} />;
}
