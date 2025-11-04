import { motion } from 'framer-motion';

type HeaderMode = 'view' | 'new' | 'update';

interface EventInfoTabHeaderProps {
  mode: HeaderMode;
  onNew?: () => void;
  onCancel?: () => void;
  onPublish?: () => void;
  onUpdate?: () => void;
}

const EventInfoTabHeader = ({ mode, onNew, onCancel, onPublish, onUpdate }: EventInfoTabHeaderProps) => {
  return (
    <motion.div
      className="flex items-center justify-between"
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {mode === 'view' ? (
        <>
          <h1 className="text-xl-style text-[#F7F7F7]">Posts</h1>
          <button
            onClick={onNew}
            className="bg-[#F7F7F7] rounded-full px-5 py-3 gap-2 flex flex-row justify-center items-center hover:bg-white transition-colors min-w-[100px]"
          >
            <div className="text-md text-BG">New</div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M4 8H12"
                stroke="#0A0A0A"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 12V4"
                stroke="#0A0A0A"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      ) : (
        <>
          <h1 className="text-xl-style text-[#F7F7F7]">
            {mode === 'new' ? 'New Post' : 'Update Post'}
          </h1>
          <div className="flex gap-2.5">
            <button
              onClick={onCancel}
              className="bg-[#ff0d000d] rounded-full px-5 py-3 text-md text-[#ff0d00] hover:bg-[#ff0d001a] transition-colors min-w-[100px]"
            >
              Cancel
            </button>
            <button
              onClick={mode === 'new' ? onPublish : onUpdate}
              className="bg-[#F7F7F7] rounded-full px-5 py-3 text-md text-BG hover:bg-white transition-colors min-w-[100px]"
            >
              {mode === 'new' ? 'Publish' : 'Update'}
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default EventInfoTabHeader;