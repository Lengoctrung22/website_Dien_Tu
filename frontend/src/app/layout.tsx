import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import StorefrontWrapper from '@/components/StorefrontWrapper';

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
    <html lang="vi" className="dark">
      <body className="min-h-screen bg-slate-50 dark:bg-[#07090e] text-slate-900 dark:text-slate-100 antialiased selection:bg-cyan-500 selection:text-white">
        <Providers>
          <StorefrontWrapper>{children}</StorefrontWrapper>
        </Providers>
      </body>
    </html>
  );
}
