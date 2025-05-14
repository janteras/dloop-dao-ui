import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ConnectButton } from "@/components/features/wallet/ConnectButton";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const AppHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const navItems = [
    { name: "Dashboard", path: "/" },
    { name: "AssetDAO", path: "/assetdao" },
    { name: "Leaderboard", path: "/leaderboard" },
    { name: "AI Nodes", path: "/ainodes" },
    { name: "ProtocolDAO", path: "/protocoldao" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b shadow-lg">
      <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
          >
            <path 
              d="M50 10C27.909 10 10 27.909 10 50C10 72.091 27.909 90 50 90C72.091 90 90 72.091 90 50C90 27.909 72.091 10 50 10ZM50 20C66.569 20 80 33.431 80 50C80 66.569 66.569 80 50 80C33.431 80 20 66.569 20 50C20 33.431 33.431 20 50 20Z" 
              fill="currentColor"
            />
            <path 
              d="M65 35C57.268 35 51 41.268 51 49C51 56.732 57.268 63 65 63C72.732 63 79 56.732 79 49C79 41.268 72.732 35 65 35Z" 
              fill="currentColor"
            />
          </svg>
          <span className="ml-3 text-xl font-semibold">d-loop</span>
        </div>
        
        {/* Navigation (Desktop) */}
        <nav className="hidden lg:flex space-x-6">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              onClick={closeMenu}
            >
              <a className={`${
                isActive(item.path) 
                  ? "text-primary font-medium" 
                  : "text-muted-foreground hover:text-foreground"
              } transition-colors`}>
                {item.name}
              </a>
            </Link>
          ))}
        </nav>
        
        {/* Connect Wallet Button / Account and Theme Toggle */}
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <ThemeToggle variant="mini" className="mr-1" />
          <ConnectButton />
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          className="lg:hidden ml-4 focus:outline-none"
          onClick={toggleMenu}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>
      
      {/* Mobile Navigation */}
      <div className={`lg:hidden px-4 py-3 border-t ${isMenuOpen ? 'block' : 'hidden'}`}>
        <nav className="flex flex-col space-y-3">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              onClick={closeMenu}
            >
              <a className={`${
                isActive(item.path) 
                  ? "text-primary font-medium" 
                  : "text-muted-foreground hover:text-foreground"
              } transition-colors py-2`}>
                {item.name}
              </a>
            </Link>
          ))}
          
          {/* Theme toggle in mobile menu */}
          <div className="flex items-center justify-between py-2 border-t mt-2">
            <span className="text-muted-foreground">Theme</span>
            <ThemeToggle variant="animated" />
          </div>
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;
