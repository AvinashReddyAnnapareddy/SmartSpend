import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <Sidebar />
      <main className="pl-[240px] flex flex-col min-h-screen">
        {children}
      </main>
    </div>
  );
}
