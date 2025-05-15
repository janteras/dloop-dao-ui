import { Card, CardHeader, CardContent } from '@/components/common/ui/card';
import { Skeleton } from '@/components/common/ui/skeleton';
import { motion } from 'framer-motion';

interface ParticipantSkeletonProps {
  index?: number;
}

export function ParticipantSkeleton({ index = 0 }: ParticipantSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      <Card className="overflow-hidden border-l-4 border-l-gray-300 dark:border-l-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <Skeleton className="h-8 w-14 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-1 mb-1">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ParticipantSkeletonGroup({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <ParticipantSkeleton key={index} index={index} />
      ))}
    </>
  );
}