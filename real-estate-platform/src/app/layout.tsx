import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Saudi Real Estate | عقارات السعودية',
  description: 'Leading real estate platform in Saudi Arabia',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
