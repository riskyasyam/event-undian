'use client';

/**
 * Admin Layout with Sidebar - Professional Design
 */

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarHidden, setDesktopSidebarHidden] = useState(false);

  useEffect(() => {
    // Fokuskan area undian agar layar terasa full-width saat drawing.
    setDesktopSidebarHidden(pathname.startsWith('/admin/undi'));
  }, [pathname]);

  // Don't show layout on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        desktopHidden={desktopSidebarHidden}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`transition-[padding] duration-300 ${
          desktopSidebarHidden ? 'lg:pl-0' : 'lg:pl-56'
        }`}
      >
        {/* Top Header with Hamburger for Mobile */}
        <header className="sticky top-0 z-30 bg-black border-b border-yellow-500/20 shadow-lg">
          <div className="px-4 h-14 flex items-center justify-between">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-yellow-500 hover:bg-yellow-500/10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Desktop Sidebar Toggle */}
            <button
              onClick={() => setDesktopSidebarHidden((prev) => !prev)}
              className="hidden lg:inline-flex p-2 rounded-lg text-yellow-500 hover:bg-yellow-500/10"
              title={desktopSidebarHidden ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
              aria-label={desktopSidebarHidden ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
            >
              {desktopSidebarHidden ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              )}
            </button>

            {/* Page Title */}
            <div className="flex-1 flex justify-center lg:justify-start lg:ml-0">
              <h2 className="text-sm font-semibold text-yellow-500">
                Admin Panel
              </h2>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
