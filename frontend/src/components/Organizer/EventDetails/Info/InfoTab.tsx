import EventInfoTabHeader from '@components/Organizer/EventDetails/Info/EventInfoTabHeader';
import PostCard from '@components/Organizer/EventDetails/Info/PostCard';
import EmptyState from '@components/Organizer/EventDetails/Info/EmptyState';
import TextInputLine from '@components/Organizer/CreateEvent/Details/TextInputLine';
import ImageUpload from '@components/Auth/ImageUpload';
import LongTextInput from '@components/Organizer/CreateEvent/Details/LongTextInput';
import LoadingRipple from '@components/Organizer/EventDetails/LoadingRipple';
import { usePosts, useCreatePost, useUpdatePost, useDeletePost } from '@/hooks/usePosts';
import type { Post } from '@/api/posts';
import type { Event } from '@/api/events';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InfoTabProps {
  event: Event;
}

type ViewMode = 'view' | 'new' | 'update';

const InfoTab = ({ event }: InfoTabProps) => {
  const { id: eventId } = event;
  const { data: posts, isLoading, error } = usePosts(eventId);
  const createMutation = useCreatePost(eventId);
  const updateMutation = useUpdatePost(eventId);
  const deleteMutation = useDeletePost(eventId);

  // View mode state
  const [mode, setMode] = useState<ViewMode>('view');

  // Preload images in the background when posts are loaded
  useEffect(() => {
    if (posts && posts.length > 0) {
      posts.forEach((post) => {
        if (post.imageUrl) {
          const img = new Image();
          img.src = post.imageUrl;
        }
      });
    }
  }, [posts]);

  // Create post state
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  const [newImage, setNewImage] = useState<File | undefined>(undefined);

  // Edit post state
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [editImage, setEditImage] = useState<File | undefined>(undefined);

  // Handle new post flow
  const handleStartNew = () => {
    setMode('new');
    setNewTitle('');
    setNewText('');
    setNewImage(undefined);
  };

  const handlePublish = async () => {
    if (!newTitle.trim() || !newText.trim()) {
      alert('Please fill in both title and text');
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: newTitle,
        text: newText,
        ...(newImage && { image: newImage }),
      });

      // Reset form and return to view mode
      setNewTitle('');
      setNewText('');
      setNewImage(undefined);
      setMode('view');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    }
  };

  const handleCancelNew = () => {
    setMode('view');
    setNewTitle('');
    setNewText('');
    setNewImage(undefined);
  };

  // Handle edit post flow
  const handleStartEdit = (post: Post) => {
    setMode('update');
    setEditingPostId(post.id);
    setEditTitle(post.title);
    setEditText(post.text);
    setEditImage(undefined);
  };

  const handleUpdate = async () => {
    if (!editingPostId) return;

    if (!editTitle.trim() || !editText.trim()) {
      alert('Please fill in both title and text');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        postId: editingPostId,
        data: {
          title: editTitle,
          text: editText,
          ...(editImage && { image: editImage }),
        },
      });

      // Reset form and return to view mode
      setEditingPostId(null);
      setEditImage(undefined);
      setMode('view');
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setMode('view');
    setEditingPostId(null);
    setEditImage(undefined);
  };

  // Handle delete post
  const handleDeletePost = async (postId: number) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteMutation.mutateAsync(postId);
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex justify-center items-center p-6">
        <LoadingRipple />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="absolute inset-0 flex justify-center items-center p-6">
        <div className="bg-[rgba(255,13,0,0.1)] border border-[rgba(255,13,0,0.3)] rounded-[20px] p-6 text-center max-w-md">
          <p className="text-[#FF0D00]">Failed to load posts. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto [&::-webkit-scrollbar]:hidden">
      {/* Content starts with padding for header */}
      <div className="pt-[5.5rem] px-2.5 pb-[5rem]">
        {/* InfoTab Header */}
        <EventInfoTabHeader
          mode={mode}
          onNew={handleStartNew}
          onCancel={mode === 'new' ? handleCancelNew : handleCancelEdit}
          onPublish={handlePublish}
          onUpdate={handleUpdate}
        />

        {/* Main scrollable content */}
        <div className="pt-6">
        <AnimatePresence mode="wait" initial={false}>
          {mode === 'view' ? (
            <motion.div
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.15,
                exit: { duration: 0.1 }
              }}
              className="flex flex-col"
            >
              {!posts || posts.length === 0 ? (
                <EmptyState onCreateFirst={handleStartNew} />
              ) : (
                <div className="flex flex-col gap-2.5 [&::-webkit-scrollbar]:hidden"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  <AnimatePresence initial={false}>
                    {posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onClick={() => handleStartEdit(post)}
                        onDelete={() => handleDeletePost(post.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          ) : mode === 'new' ? (
            <motion.div
              key="new"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ 
                duration: 0.15,
                exit: { duration: 0.1 }
              }}
              className="flex flex-col gap-4"
              style={{ willChange: 'transform, opacity' }}
            >
              <TextInputLine
                label="Title"
                value={newTitle}
                onChange={setNewTitle}
                placeholder="Enter post title..."
                maxLength={100}
                showCharCount={true}
              />
              <ImageUpload
                onImageChange={setNewImage}
                className="w-full"
              />
              <LongTextInput
                title="Content"
                value={newText}
                onChange={setNewText}
                placeholder="Write your post content..."
                maxLength={500}
                showCharacterCount={true}
              />
            </motion.div>
          ) : (
            <motion.div
              key="update"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ 
                duration: 0.15,
                exit: { duration: 0.1 }
              }}
              className="flex flex-col gap-4"
              style={{ willChange: 'transform, opacity' }}
            >
              <TextInputLine
                label="Title"
                value={editTitle}
                onChange={setEditTitle}
                placeholder="Enter post title..."
                maxLength={100}
                showCharCount={true}
              />
              <ImageUpload
                onImageChange={setEditImage}
                className="w-full"
              />
              <LongTextInput
                title="Content"
                value={editText}
                onChange={setEditText}
                placeholder="Write your post content..."
                maxLength={500}
                showCharacterCount={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default InfoTab;