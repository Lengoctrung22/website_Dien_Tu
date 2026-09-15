import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import StorefrontWrapper from '@/components/StorefrontWrapper';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TECHGEAR PRO - Thiết Bị & Phụ Kiện Máy Tính Cao Cấp',
  description: 'Chuyên cung cấp màn hình OLED 240Hz, bàn phím cơ Rapid Trigger, chuột gaming siêu nhẹ, tai nghe chống ồn thi đấu esports.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={plusJakartaSans.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  document.documentElement.classList.remove('dark');
                  localStorage.setItem('techgear_theme', 'light');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${plusJakartaSans.variable} font-sans min-h-screen bg-white text-slate-900 antialiased selection:bg-cyan-500 selection:text-white`}>
        <Providers>
          <StorefrontWrapper>{children}</StorefrontWrapper>
        </Providers>
      </body>
    </html>
  );
}
