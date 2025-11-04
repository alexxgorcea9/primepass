import { motion } from 'framer-motion';

interface EmptyStateProps {
  onCreateFirst: () => void;
}

const EmptyState = ({ onCreateFirst }: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >

      <svg width="120" height="120" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_1409_4055)">
          <rect width="300" height="300" rx="80" fill="transparent" filter="url(#filter0_iiiiiii_1409_4055)" />
          <g filter="url(#filter1_dddddd_1409_4055)">
            <path
              d="M198 176.667C198 192.667 190 203.333 171.333 203.333H128.667C110 203.333 102 192.667 102 176.667V123.333C102 107.333 110 96.6665 128.667 96.6665H171.333C190 96.6665 198 107.333 198 123.333V176.667Z"
              stroke="#D9B3E2" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M163.336 110V120.667C163.336 126.533 168.136 131.333 174.003 131.333H184.669" stroke="#D9B3E2"
                  strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M128.664 155.333H149.997" stroke="#D9B3E2" strokeWidth="10" strokeLinecap="round"
                  strokeLinejoin="round" />
            <path d="M128.664 176.667H171.331" stroke="#D9B3E2" strokeWidth="10" strokeLinecap="round"
                  strokeLinejoin="round" />
          </g>
        </g>
        <defs>
          <filter id="filter0_iiiiiii_1409_4055" x="-100" y="-100" width="500" height="500" filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                           result="hardAlpha" />
            <feMorphology radius="1" operator="erode" in="SourceAlpha" result="effect1_innerShadow_1409_4055" />
            <feOffset />
            <feGaussianBlur stdDeviation="5" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.968627 0 0 0 0 0.968627 0 0 0 0 0.968627 0 0 0 0.25 0" />
            <feBlend mode="normal" in2="shape" result="effect1_innerShadow_1409_4055" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                           result="hardAlpha" />
            <feOffset dy="1" />
            <feGaussianBlur stdDeviation="20" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.85098 0 0 0 0 0.701961 0 0 0 0 0.886275 0 0 0 0.2 0" />
            <feBlend mode="normal" in2="effect1_innerShadow_1409_4055" result="effect2_innerShadow_1409_4055" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                           result="hardAlpha" />
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="9" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.603922 0 0 0 0 0.360784 0 0 0 0 0.639216 0 0 0 0.3 0" />
            <feBlend mode="normal" in2="effect2_innerShadow_1409_4055" result="effect3_innerShadow_1409_4055" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                           result="hardAlpha" />
            <feMorphology radius="48" operator="dilate" in="SourceAlpha" result="effect4_innerShadow_1409_4055" />
            <feOffset dy="98" />
            <feGaussianBlur stdDeviation="50" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.603922 0 0 0 0 0.360784 0 0 0 0 0.639216 0 0 0 0.3 0" />
            <feBlend mode="normal" in2="effect3_innerShadow_1409_4055" result="effect4_innerShadow_1409_4055" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                           result="hardAlpha" />
            <feMorphology radius="64" operator="dilate" in="SourceAlpha" result="effect5_innerShadow_1409_4055" />
            <feOffset dy="-82" />
            <feGaussianBlur stdDeviation="34" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.603922 0 0 0 0 0.360784 0 0 0 0 0.639216 0 0 0 0.3 0" />
            <feBlend mode="normal" in2="effect4_innerShadow_1409_4055" result="effect5_innerShadow_1409_4055" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                           result="hardAlpha" />
            <feMorphology radius="4" operator="dilate" in="SourceAlpha" result="effect6_innerShadow_1409_4055" />
            <feOffset dy="7" />
            <feGaussianBlur stdDeviation="5.5" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.968627 0 0 0 0 0.968627 0 0 0 0 0.968627 0 0 0 1 0" />
            <feBlend mode="normal" in2="effect5_innerShadow_1409_4055" result="effect6_innerShadow_1409_4055" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                           result="hardAlpha" />
            <feMorphology radius="36" operator="dilate" in="SourceAlpha" result="effect7_innerShadow_1409_4055" />
            <feOffset dy="39" />
            <feGaussianBlur stdDeviation="28" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.968627 0 0 0 0 0.968627 0 0 0 0 0.968627 0 0 0 0.5 0" />
            <feBlend mode="normal" in2="effect6_innerShadow_1409_4055" result="effect7_innerShadow_1409_4055" />
          </filter>
          <clipPath id="bgblur_1_1409_4055_clip_path" transform="translate(100 100)">
            <rect width="300" height="300" rx="80" />
          </clipPath>
          <filter id="filter1_dddddd_1409_4055" x="-164" y="-164" width="628" height="628" filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                           result="hardAlpha" />
            <feOffset />
            <feGaussianBlur stdDeviation="5.76" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.839216 0 0 0 0 0.317647 0 0 0 0 0.572549 0 0 0 1 0" />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1409_4055" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                           result="hardAlpha" />
            <feOffset />
            <feGaussianBlur stdDeviation="11.52" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.839216 0 0 0 0 0.317647 0 0 0 0 0.572549 0 0 0 1 0" />
            <feBlend mode="normal" in2="effect1_dropShadow_1409_4055" result="effect2_dropShadow_1409_4055" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                           result="hardAlpha" />
            <feOffset />
            <feGaussianBlur stdDeviation="40.32" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.839216 0 0 0 0 0.317647 0 0 0 0 0.572549 0 0 0 1 0" />
            <feBlend mode="normal" in2="effect2_dropShadow_1409_4055" result="effect3_dropShadow_1409_4055" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                           result="hardAlpha" />
            <feOffset />
            <feGaussianBlur stdDeviation="80.64" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.839216 0 0 0 0 0.317647 0 0 0 0 0.572549 0 0 0 1 0" />
            <feBlend mode="normal" in2="effect3_dropShadow_1409_4055" result="effect4_dropShadow_1409_4055" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                           result="hardAlpha" />
            <feOffset />
            <feGaussianBlur stdDeviation="125" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.839216 0 0 0 0 0.317647 0 0 0 0 0.572549 0 0 0 1 0" />
            <feBlend mode="normal" in2="effect4_dropShadow_1409_4055" result="effect5_dropShadow_1409_4055" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                           result="hardAlpha" />
            <feOffset />
            <feGaussianBlur stdDeviation="125" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.839216 0 0 0 0 0.317647 0 0 0 0 0.572549 0 0 0 1 0" />
            <feBlend mode="normal" in2="effect5_dropShadow_1409_4055" result="effect6_dropShadow_1409_4055" />
            <feBlend mode="normal" in="SourceGraphic" in2="effect6_dropShadow_1409_4055" result="shape" />
          </filter>
          <clipPath id="clip0_1409_4055">
            <rect width="300" height="300" rx="80" fill="none" />
          </clipPath>
        </defs>
      </svg>

      <h3 className="text-xl-style text-[#F7F7F7] mt-10 mb-2 text-center">
        No posts yet
      </h3>

      <p className="text-md-style text-[rgba(247,247,247,0.6)] text-center mb-6 max-w-md">
        Share updates, announcements, and important information with your attendees by creating your first post.
      </p>

      <button
        onClick={onCreateFirst}
        className="bg-[#F7F7F7] rounded-full px-6 py-3 text-md-style text-BG hover:bg-white transition-colors flex items-center gap-2"
      >
        Create your first post
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
    </motion.div>
  );
};

export default EmptyState;
