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
    <html lang="vi" className={`dark ${plusJakartaSans.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('techgear_theme');
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${plusJakartaSans.variable} font-sans min-h-screen bg-slate-50 dark:bg-surface-canvas text-slate-900 dark:text-slate-100 antialiased selection:bg-cyan-500 selection:text-white`}>
        <Providers>
          <StorefrontWrapper>{children}</StorefrontWrapper>
        </Providers>
      </body>
    </html>
  );
}
