import Security from'@/assets/security-safe.svg';
import { Event } from '@/api/events';

interface TeamTabProps {
  event: Event;
}

const TeamTab = ({ event }: TeamTabProps) => {
  return (
    <div className="h-full w-full pt-[5.5rem] overflow-y-auto [&::-webkit-scrollbar]:hidden">

      {/* Access Code */}
      <div className="w-full h-fit p-2.5 flex flex-row gap-2.5">

        <div className="rounded-full bg-white w-12 h-12 items-center justify-center flex">
          <img src={Security} alt="Security" className="w-6 h-6" />
        </div>

        <div className="flex flex-col">
          <div className="text-grey text-md leading-[18px]">
            Access Code
          </div>
          <div className="text-white text-2xl leading-normal">
            {event.accessCode || 'N/A'}
          </div>
        </div>
      </div>

    </div>
  );
};

export default TeamTab;