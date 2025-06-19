'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DynamicWalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/transactions', label: 'Transactions' },
  ];

  const isActiveLink = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 w-full z-50 shadow-sm transition-all duration-300 bg-gray-100 dark:bg-gray-900"
      style={{ backgroundColor: 'color-mix(in srgb, var(--background) 80%, transparent)', backdropFilter: 'blur(8px)' }}
    >
      {/* Main navbar container with visible padding */}
      <div className="mx-auto flex items-center justify-between h-16 !px-8 sm:!px-12 lg:!px-16 bg-blue-200/50">
        {/* Left side: Logo + Mobile menu button */}
        <div className="flex items-center space-x-6">
          {/* Mobile Menu Button */}
          <button
            className="p-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
            style={{ color: 'var(--secondary)' }}
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <svg
              className={`w-6 h-6 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-2 text-xl font-bold hover:opacity-90 transition-opacity">
            <div
              className="w-8 h-8 rounded-md text-white font-bold text-sm flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              N
            </div>
            <span style={{ color: 'var(--foreground)' }}>NOTES DAPP</span>
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
        <div className="hidden lg:flex items-center space-x-4 gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 bg-gray-300/30"
              style={{
                color: isActiveLink(link.href) ? 'var(--primary)' : 'var(--secondary)',
                backgroundColor: isActiveLink(link.href)
                  ? 'color-mix(in srgb, var(--primary) 10%, transparent)'
                  : 'transparent',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side: Wallet Button */}
        <div className="flex items-center">
          <div className="px-6 py-3 bg-gray-300/30 rounded-md">
            <DynamicWalletMultiButton
              className="text-sm font-medium transition-all duration-200 w-full text-center"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--foreground)' }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden border-t bg-gray-100 dark:bg-gray-900"
          style={{ borderColor: 'var(--secondary)', backgroundColor: 'var(--background)' }}
        >
          <div className="px-8 py-6 space-y-4 bg-blue-200/50">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-6 py-4 rounded-md text-base font-medium transition-all duration-200 bg-gray-300/30"
                style={{
                  color: isActiveLink(link.href) ? 'var(--primary)' : 'var(--secondary)',
                  backgroundColor: isActiveLink(link.href)
                    ? 'color-mix(in srgb, var(--primary) 10%, transparent)'
                    : 'transparent',
                }}
                onClick={toggleMobileMenu}
              >
                {link.label}
              </Link>
            ))}
            {/* Mobile Wallet Button */}
            <div className="mt-4 pt-4 border-t" style={{ borderTopColor: 'var(--secondary)' }}>
              <div className="px-6 py-4 bg-gray-300/30 rounded-md">
                <DynamicWalletMultiButton
                  className="w-full text-sm font-medium text-center transition-all duration-200"
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--foreground)' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;