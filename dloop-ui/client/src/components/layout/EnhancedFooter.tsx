import { FileText, BookOpen, Twitter, Linkedin, Github, ExternalLink, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface FooterLink {
  name: string;
  url: string;
  icon: React.ReactNode;
  description: string;
}

interface EnhancedFooterProps {
  className?: string;
  showBuildInfo?: boolean;
}

export function EnhancedFooter({ className, showBuildInfo = true }: EnhancedFooterProps) {
  const currentYear = new Date().getFullYear();
  const buildDate = "May 2025"; // You can replace this with a dynamic build date if needed
  
  const links: FooterLink[] = [
    { 
      name: "Whitepaper", 
      url: "https://d-loop.io/uploads/d-loop-whitepaper.pdf", 
      icon: <FileText className="w-4 h-4" />,
      description: "Read our protocol documentation"
    },
    { 
      name: "Medium", 
      url: "https://medium.com/@d-loop", 
      icon: <BookOpen className="w-4 h-4" />,
      description: "Follow our blog posts"
    },
    { 
      name: "Twitter", 
      url: "https://twitter.com/dloopDAO", 
      icon: <Twitter className="w-4 h-4" />,
      description: "Get the latest updates"
    },
    { 
      name: "LinkedIn", 
      url: "https://linkedin.com/company/d-loop-io", 
      icon: <Linkedin className="w-4 h-4" />,
      description: "Connect with our team"
    },
    { 
      name: "Github", 
      url: "https://github.com/d-loopDAO", 
      icon: <Github className="w-4 h-4" />,
      description: "Explore our code"
    },
  ];

  return (
    <footer className={cn(
      "border-t border-border bg-card text-card-foreground py-8 mt-auto",
      className
    )}>
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
        {/* Top Section with Logo and Links */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Logo and Brand */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center mb-3">
              <svg 
                width="36" 
                height="36" 
                viewBox="0 0 100 100" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary"
                aria-hidden="true"
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
              <span className="ml-3 text-xl font-semibold tracking-tight">D-LOOP</span>
              {showBuildInfo && (
                <Badge variant="outline" className="ml-2 text-xs font-normal">
                  Beta
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground text-center md:text-left max-w-xs mb-4">
              Stable, Self-Governing Digital Money | Powered by AI & Community
            </p>
          </div>
          
          {/* Links Section */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-6 gap-y-4">
            {links.map((link) => (
              <div key={link.name}>
                <a 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex flex-col items-center text-center group"
                  aria-label={`Visit ${link.name}`}
                  title={link.description}
                >
                  <div className="h-10 w-10 mb-2 rounded-full border border-border bg-background flex items-center justify-center group-hover:border-primary group-hover:text-primary transition-all duration-200">
                    {link.icon}
                  </div>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">
                    {link.name}
                  </span>
                </a>
              </div>
            ))}
          </div>
        </div>
        
        {/* Middle Section - Quick Links */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <h4 className="font-medium mb-3 text-sm">Protocol</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://d-loop.io" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="https://medium.com/@d-loop" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="https://medium.com/@d-loop" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Roadmap
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-3 text-sm">Community</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://t.me/dloopofficial" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Forum
                </a>
              </li>
              <li>
                <a href="https://discord.com/invite/zYwbkcHfTQ" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Discord
                </a>
              </li>
              <li>
                <a href="https://t.me/dloopofficial" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Telegram
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-3 text-sm">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://d-loop.io/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="https://d-loop.io/tutorials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Tutorials
                </a>
              </li>
              <li>
                <a href="https://d-loop.io/security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Security
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-3 text-sm">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://d-loop.io/terms.html" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a 
                  href="https://d-loop.io/privacy.html" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="https://d-loop.io/disclaimer.html" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Disclaimer
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground mb-4 md:mb-0">
            &copy; {currentYear} D-LOOP Protocol. All rights reserved.
          </p>
          
          {showBuildInfo && (
            <div className="flex items-center text-xs text-muted-foreground">
              <span>Built with</span>
              <Heart className="h-3 w-3 mx-1 text-red-500" />
              <span>| Last updated: {buildDate}</span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

export default EnhancedFooter;