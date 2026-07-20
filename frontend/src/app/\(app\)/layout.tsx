'use client';

import Header from '@/app/Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full px-4 md:px-8 py-8 max-w-[1600px]">
        {children}
      </main>
    </>
  );
}