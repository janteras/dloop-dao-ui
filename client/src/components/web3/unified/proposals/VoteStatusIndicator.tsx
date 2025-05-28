
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface VoteStatusIndicatorProps {
  hasVoted: boolean;
  userVoteSupport?: boolean;
  proposalStatus: string;
  className?: string;
}

export function VoteStatusIndicator({ 
  hasVoted, 
  userVoteSupport, 
  proposalStatus,
  className = ""
}: VoteStatusIndicatorProps) {
  if (!hasVoted) {
    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${className}`}>
        <Clock className="w-3 h-3" />
        Not voted
      </Badge>
    );
  }

  const voteType = userVoteSupport ? 'For' : 'Against';
  const icon = userVoteSupport ? CheckCircle : XCircle;
  const variant = userVoteSupport ? 'default' : 'destructive';

  return (
    <Badge variant={variant} className={`flex items-center gap-1 ${className}`}>
      {React.createElement(icon, { className: "w-3 h-3" })}
      Voted {voteType}
    </Badge>
  );
}

export default VoteStatusIndicator;
