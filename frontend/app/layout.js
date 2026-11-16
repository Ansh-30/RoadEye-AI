import './globals.css';
import { AuthProvider } from '@/context/auth-context';

export const metadata = {
  title: 'RoadEye AI',
  description: 'AI-powered road intelligence and maintenance platform.',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
