import { FileText, BookOpen, Twitter, Linkedin, Github, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FooterLink {
  name: string;
  url: string;
  icon: React.ReactNode;
  description?: string;
}

interface AppFooterProps {
  className?: string;
}

export function AppFooter({ className }: AppFooterProps) {
  const currentYear = new Date().getFullYear();
  
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
    <footer className={cn("border-t border-border bg-background py-8 mt-12", className)}>
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Logo and Brand */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center mb-3">
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
              <span className="ml-3 text-lg font-semibold tracking-tight">D-LOOP</span>
            </div>
            <p className="text-sm text-muted-foreground text-center md:text-left max-w-xs">
              A decentralized governance protocol for AI-powered financial instruments
            </p>
          </div>
          
          {/* Links Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
            {links.map((link) => (
              <a 
                key={link.name}
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex flex-col items-center text-center"
                aria-label={`Visit ${link.name}`}
              >
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-10 w-10 rounded-full mb-2 hover:text-primary hover:border-primary"
                >
                  {link.icon}
                </Button>
                <span className="text-sm font-medium hover:text-primary transition-colors">
                  {link.name}
                </span>
              </a>
            ))}
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground mb-4 sm:mb-0">
            &copy; {currentYear} D-LOOP Protocol. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4">
            <a 
              href="https://d-loop.io/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </a>
            <a 
              href="https://d-loop.io/privacy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;