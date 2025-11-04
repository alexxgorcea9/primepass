import { motion } from 'framer-motion';
import type { SVGProps } from 'react';

// Icon Components with dynamic stroke color support
const TicketIcon = ({ className }: SVGProps<SVGSVGElement>) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    className={className}
  >
    <path
      d="M14.6673 6.6665V5.99984C14.6673 3.33317 14.0007 2.6665 11.334 2.6665H4.66732C2.00065 2.6665 1.33398 3.33317 1.33398 5.99984V6.33317C2.25398 6.33317 3.00065 7.07984 3.00065 7.99984C3.00065 8.91984 2.25398 9.6665 1.33398 9.6665V9.99984C1.33398 12.6665 2.00065 13.3332 4.66732 13.3332H11.334C14.0007 13.3332 14.6673 12.6665 14.6673 9.99984C13.7473 9.99984 13.0007 9.25317 13.0007 8.33317C13.0007 7.41317 13.7473 6.6665 14.6673 6.6665Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.66602 2.6665L6.66602 13.3332"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="5 5"
    />
  </svg>
);

const StarIcon = ({ className }: SVGProps<SVGSVGElement>) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    className={className}
  >
    <path
      d="M11.2 5.353C11.3266 5.613 11.6666 5.85967 11.9533 5.913L13.6533 6.193C14.74 6.373 14.9933 7.15967 14.2133 7.94634L12.8866 9.27301C12.6666 9.49301 12.54 9.92634 12.6133 10.2397L12.9933 11.8797C13.2933 13.173 12.6 13.6797 11.46 12.9997L9.86663 12.053C9.57996 11.8797 9.09997 11.8797 8.8133 12.053L7.21996 12.9997C6.07996 13.673 5.38663 13.173 5.68663 11.8797L6.06664 10.2397C6.13997 9.933 6.0133 9.49967 5.7933 9.27301L4.46664 7.94634C3.68664 7.16634 3.93997 6.37967 5.02664 6.193L6.72663 5.913C7.0133 5.86633 7.3533 5.613 7.47997 5.353L8.41997 3.47301C8.91997 2.45301 9.74664 2.45301 10.26 3.47301L11.2 5.353Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.33334 3.33301H1.33334"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.33334 12.667H1.33334"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.00001 8H1.33334"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TeamIcon = ({ className }: SVGProps<SVGSVGElement>) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    className={className}
  >
    <path
      d="M5.88671 7.24634C4.30004 7.19301 3.04004 5.89301 3.04004 4.29301C3.04004 2.65967 4.36004 1.33301 6.00004 1.33301C7.63337 1.33301 8.96004 2.65967 8.96004 4.29301C8.95337 5.89301 7.69337 7.19301 6.10671 7.24634C6.04004 7.23967 5.96004 7.23967 5.88671 7.24634Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round" />
    <path
      d="M10.94 2.66699C12.2334 2.66699 13.2734 3.71366 13.2734 5.00033C13.2734 6.26033 12.2734 7.28699 11.0267 7.33366C10.9734 7.32699 10.9134 7.32699 10.8534 7.33366"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round" />
    <path
      d="M2.77332 13.6203C4.60666 14.847 7.61332 14.847 9.44666 13.6203C11.06 12.5403 11.06 10.7803 9.44666 9.70699C7.61999 8.48699 4.61332 8.48699 2.77332 9.70699C1.15999 10.787 1.15999 12.547 2.77332 13.6203Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round" />
    <path
      d="M12.2267 13.333C12.7067 13.233 13.16 13.0397 13.5334 12.753C14.5734 11.973 14.5734 10.6863 13.5334 9.90634C13.1667 9.62634 12.72 9.43967 12.2467 9.33301"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round" />
  </svg>

);

const InfoIcon = ({ className }: SVGProps<SVGSVGElement>) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    className={className}
  >
    <path
      d="M14.6667 2.82016C14.6667 1.76016 14.24 1.3335 13.18 1.3335H10.4867C9.42667 1.3335 9 1.76016 9 2.82016V5.5135C9 6.5735 9.42667 7.00016 10.4867 7.00016H13.18C14.24 7.00016 14.6667 6.5735 14.6667 5.5135V2.82016Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.00065 2.6535C7.00065 1.7135 6.57398 1.3335 5.51398 1.3335H2.82065C1.76065 1.3335 1.33398 1.7135 1.33398 2.6535V5.6735C1.33398 6.62016 1.76065 6.9935 2.82065 6.9935H5.51398C6.57398 7.00016 7.00065 6.62016 7.00065 5.68016V2.6535Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.00065 10.4867C7.00065 9.42667 6.57398 9 5.51398 9H2.82065C1.76065 9 1.33398 9.42667 1.33398 10.4867V13.18C1.33398 14.24 1.76065 14.6667 2.82065 14.6667H5.51398C6.57398 14.6667 7.00065 14.24 7.00065 13.18V10.4867Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 10.3335H14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M10 13H14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const CheckinIcon = ({ className }: SVGProps<SVGSVGElement>) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <path
      d="M2 9V6.5C2 4.01 4.01 2 6.5 2H9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15 2H17.5C19.99 2 22 4.01 22 6.5V9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22 16V17.5C22 19.99 19.99 22 17.5 22H16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 22H6.5C4.01 22 2 19.99 2 17.5V15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.5 9C10.5 10 10 10.5 9 10.5H7C6 10.5 5.5 10 5.5 9V7C5.5 6 6 5.5 7 5.5H9C10 5.5 10.5 6 10.5 7V9Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.5 9C18.5 10 18 10.5 17 10.5H15C14 10.5 13.5 10 13.5 9V7C13.5 6 14 5.5 15 5.5H17C18 5.5 18.5 6 18.5 7V9Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.5 17C10.5 18 10 18.5 9 18.5H7C6 18.5 5.5 18 5.5 17V15C5.5 14 6 13.5 7 13.5H9C10 13.5 10.5 14 10.5 15V17Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.5 17C18.5 18 18 18.5 17 18.5H15C14 18.5 13.5 18 13.5 17V15C13.5 14 14 13.5 15 13.5H17C18 13.5 18.5 14 18.5 15V17Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const NAV_ITEMS = [
  { name: 'Tickets', Icon: TicketIcon },
  { name: 'Concierge', Icon: StarIcon },
  { name: 'Team', Icon: TeamIcon},
  { name: 'Info', Icon: InfoIcon },
  { name: 'Checkin', Icon: CheckinIcon },
] as const;

interface EventDetailsNavBarProps {
  activeTab: number;
  onTabChange: (index: number) => void;
}

export default function EventDetailsNavBar({
                                             activeTab,
                                             onTabChange
                                           }: EventDetailsNavBarProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-2.5 inline-flex justify-start items-center gap-2.5 overflow-hidden z-50">
      <div className=" flex justify-center items-center gap-2.5 overflow-hidden">
        {NAV_ITEMS.map((item, index) => {
          const isActive = activeTab === index;
          const Icon = item.Icon;

          return (
            <motion.button
              key={item.name}
              onClick={() => onTabChange(index)}
              className={`
                w-12 h-12 p-2.5 rounded-full 
                inline-flex flex-col justify-center items-center 
                gap-2.5 overflow-hidden transition-colors
                ${isActive ? 'bg-white' : 'bg-BG-1'}
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={item.name}
            >
              <Icon
                className={`
                  w-4 h-4 transition-colors
                  ${isActive ? 'text-BG' : 'text-white'}
                `}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );

}

