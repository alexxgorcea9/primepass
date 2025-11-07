import { motion } from 'framer-motion';
import { memo } from 'react';
import { Clock, User } from 'lucide-react';
import type { SpecialRequestListItem } from '@/api/concierge';

interface RequestCardProps {
  request: SpecialRequestListItem;
  onClick: () => void;
}

const RequestCard = memo(({ request, onClick }: RequestCardProps) => {
  // Format timestamp to readable date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Status badge color mapping
  const getStatusColors = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-[rgba(255,193,7,0.2)] text-[#FFC107]';
      case 'in_progress':
        return 'bg-[rgba(33,150,243,0.2)] text-[#2196F3]';
      case 'resolved':
        return 'bg-[rgba(76,175,80,0.2)] text-[#4CAF50]';
      default:
        return 'bg-[rgba(255,255,255,0.1)] text-white';
    }
  };

  return (
    <motion.div
      key={request.id}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{
        opacity: 0,
        scale: 0.7,
        transition: { 
          duration: 0.25,
          ease: [0.4, 0, 0.2, 1]
        },
      }}
      transition={{ 
        duration: 0.15, 
        ease: 'easeOut',
        layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
      }}
      style={{ willChange: 'transform, opacity' }}
      className="self-stretch py-[20px] px-2.5 bg-gradient-to-r from-[rgba(217,179,226,0.30)] to-[rgba(247,247,247,0.30)] rounded-[20px] flex flex-col justify-between items-start overflow-hidden cursor-pointer hover:from-[rgba(217,179,226,0.35)] hover:to-[rgba(247,247,247,0.35)] transition-colors"
      onClick={onClick}
    >
      {/* Header with title and status badge */}
      <div className="self-stretch p-2.5 overflow-hidden flex justify-between items-start gap-3">
        <div className="flex-1 overflow-hidden flex flex-col gap-1">
          <div className="text-lg text-white font-medium truncate">{request.title}</div>
          <div className="text-sm text-white/60">
            {request.eventTitle} • {request.tierName}
          </div>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${getStatusColors(request.status)}`}
        >
          {request.status === 'pending' ? 'Pending' : 'Resolved'}
        </div>
      </div>

      {/* Guest info and metadata */}
      <div className="self-stretch px-2.5 pb-2.5 overflow-hidden flex flex-col gap-2">
        {/* Guest */}
        <div className="flex items-center gap-2 text-sm text-white/70">
          <User size={14} />
          <span className="truncate">{request.guest.name || request.guest.email}</span>
        </div>

        {/* Bottom row: timestamp and assignment */}
        <div className="flex items-center justify-between text-xs text-white/50 gap-2">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{formatDate(request.createdAt)}</span>
          </div>
          {request.assignedTo ? (
            <div className="flex items-center gap-1 truncate">
              <span>Assigned to:</span>
              <span className="font-medium text-white/70 truncate">
                {request.assignedTo.name || request.assignedTo.email}
              </span>
            </div>
          ) : (
            <span className="text-white/40">Unassigned</span>
          )}
        </div>

        {/* Message count indicator */}
        {request.messageCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-white/60">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M10.5 1.5H1.5C1.10218 1.5 0.75 1.85218 0.75 2.25V8.25C0.75 8.64782 1.10218 9 1.5 9H3.75V10.875L6.375 9H10.5C10.8978 9 11.25 8.64782 11.25 8.25V2.25C11.25 1.85218 10.8978 1.5 10.5 1.5Z"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{request.messageCount} {request.messageCount === 1 ? 'message' : 'messages'}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
});

RequestCard.displayName = 'RequestCard';

export default RequestCard;
