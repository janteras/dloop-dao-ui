import React from 'react';
import { 
  Twitter, 
  Facebook, 
  Linkedin, 
  Copy, 
  MessageSquare, 
  Share2,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { useState } from 'react';

interface SocialShareProps {
  title: string;
  description: string;
  url?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  compact?: boolean;
  platforms?: ('twitter' | 'facebook' | 'linkedin' | 'discord' | 'copy')[];
}

type PlatformWithUrl = {
  url: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  action?: undefined;
};

type PlatformWithAction = {
  action: () => void;
  icon: React.ReactNode;
  label: string;
  color: string;
  url?: undefined;
};

type PlatformData = PlatformWithUrl | PlatformWithAction;

export function SocialShare({
  title,
  description,
  url = window.location.href, // Default to current URL
  variant = 'outline',
  size = 'default',
  compact = false,
  platforms = ['twitter', 'facebook', 'linkedin', 'discord', 'copy']
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const truncatedDescription = description.length > 100 
    ? description.substring(0, 97) + '...' 
    : description;

  // Handle URL shortening if needed in the future
  const shareUrl = url;
  
  // Prepare sharing links and data
  const shareData: Record<string, PlatformData> = {
    twitter: {
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`,
      icon: <Twitter className="h-4 w-4" />,
      label: 'Twitter',
      color: 'hover:text-blue-400'
    },
    facebook: {
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(title)}`,
      icon: <Facebook className="h-4 w-4" />,
      label: 'Facebook',
      color: 'hover:text-blue-600'
    },
    linkedin: {
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      icon: <Linkedin className="h-4 w-4" />,
      label: 'LinkedIn',
      color: 'hover:text-blue-700'
    },
    discord: {
      url: `https://discord.com/channels/@me`,
      icon: <MessageSquare className="h-4 w-4" />,
      label: 'Discord',
      color: 'hover:text-purple-600'
    },
    copy: {
      action: () => {
        navigator.clipboard.writeText(
          `${title}\n${truncatedDescription}\n${shareUrl}`
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      icon: copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />,
      label: copied ? 'Copied!' : 'Copy Link',
      color: copied ? 'text-green-500' : 'hover:text-gray-700'
    }
  };

  // Filter to show only requested platforms
  const filteredPlatforms = platforms.map(platform => shareData[platform]);

  // For compact view, show only share button that opens popover
  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={variant} size={size} className="gap-2">
            <Share2 className="h-4 w-4" />
            {size !== 'icon' && <span>Share</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="end">
          <div className="grid gap-1">
            {filteredPlatforms.map((platform, i) => (
              <div key={i}>
                {platform.action ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start ${platform.color}`}
                    onClick={platform.action}
                  >
                    {platform.icon}
                    <span className="ml-2">{platform.label}</span>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start ${platform.color}`}
                    onClick={() => platform.url && window.open(platform.url, '_blank')}
                  >
                    {platform.icon}
                    <span className="ml-2">{platform.label}</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Full view shows all share options directly
  return (
    <div className="flex flex-wrap gap-2">
      {filteredPlatforms.map((platform, i) => {
        if (platform.action) {
          return (
            <Button 
              key={i}
              variant={variant} 
              size={size} 
              onClick={platform.action}
              title={platform.label}
            >
              {platform.icon}
              {size !== 'icon' && <span className="ml-2">{platform.label}</span>}
            </Button>
          );
        } else {
          return (
            <Button 
              key={i}
              variant={variant} 
              size={size} 
              onClick={() => platform.url && window.open(platform.url, '_blank')}
              title={platform.label}
            >
              {platform.icon}
              {size !== 'icon' && <span className="ml-2">{platform.label}</span>}
            </Button>
          );
        }
      })}
    </div>
  );
}