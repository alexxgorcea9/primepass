import { motion } from 'framer-motion';
import { useState, memo } from 'react';
import type { Post } from '@/api/posts';

interface PostCardProps {
  post: Post;
  onClick: () => void;
  onDelete: () => void;
}

const PostCard = memo(({ post, onClick, onDelete }: PostCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <motion.div
      key={post.id}
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
      className="self-stretch py-[20px] px-2.5 bg-gradient-to-r from-[rgba(217,179,226,0.30)] to-[rgba(247,247,247,0.30)] rounded-[20px] flex flex-col justify-between items-center overflow-hidden"
      onClick={onClick}
    >
      {/* Header with title and delete button */}
      <div className="self-stretch p-2.5 overflow-hidden flex justify-between items-center">
        <div className="overflow-hidden rounded-full flex flex-col justify-center items-center gap-2.5">
          <div className="text-lg text-white">{post.title}</div>
        </div>
        <button
          onClick={handleDelete}
          className="w-4 h-4 relative overflow-hidden group"
          aria-label="Delete post"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="transition-transform group-hover:scale-110"
          >
            <path
              d="M4.5 4.5L11.5 11.5M11.5 4.5L4.5 11.5"
              stroke="#B4B8B3"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:stroke-[#F7F7F7] transition-colors"
            />
          </svg>
        </button>
      </div>

      {/* Image (optional) */}
      {post.imageUrl && (
        <div className="self-stretch h-[280px] p-2.5 overflow-hidden rounded-[20px] relative">
          {/* Loading skeleton */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 m-2.5 bg-gradient-to-br from-[rgba(217,179,226,0.20)] to-[rgba(247,247,247,0.20)] rounded-[20px] animate-pulse" />
          )}
          
          {/* Actual image */}
          {!imageError && (
            <img
              src={post.imageUrl}
              alt={post.title}
              loading="eager"
              decoding="async"
              className={`w-full h-full object-cover rounded-[20px] transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          )}
          
          {/* Error fallback */}
          {imageError && (
            <div className="w-full h-full bg-gradient-to-br from-[rgba(217,179,226,0.15)] to-[rgba(247,247,247,0.15)] rounded-[20px] flex items-center justify-center">
              <span className="text-sm text-[#B4B8B3]">Image unavailable</span>
            </div>
          )}
        </div>
      )}

      {/* Text content */}
      <div className="self-stretch p-2.5 overflow-hidden rounded-[20px] flex flex-col justify-start items-start gap-2.5">
        <div className="self-stretch text-sm-style text-white line-clamp-3">
          {post.text}
        </div>
      </div>
    </motion.div>
  );
});

PostCard.displayName = 'PostCard';

export default PostCard;
