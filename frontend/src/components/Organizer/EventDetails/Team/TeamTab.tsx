import Security from'@/assets/security-safe.svg';
import { Event } from '@/api/events';
import TeamMemberCard from './TeamMemberCard';

interface TeamTabProps {
  event: Event;
}

const TeamTab = ({ event }: TeamTabProps) => {
  const teamMembers = event.teamMembers || [];

  return (
    <div className="h-full w-full pt-[5.5rem] overflow-y-auto [&::-webkit-scrollbar]:hidden">

      {/* Access Code */}
      <div className="w-full h-fit p-2.5 flex flex-row gap-2.5 mb-4">
        <div className="rounded-full bg-white w-12 h-12 items-center justify-center flex">
          <img src={Security} alt="Security" className="w-6 h-6" />
        </div>

        <div className="flex flex-col">
          <div className="text-grey text-md leading-[18px]">
            Access Code
          </div>
          <div className="text-white text-2xl leading-normal font-semibold">
            {event.accessCode || 'N/A'}
          </div>
        </div>
      </div>

      {/* Team Members Section */}
      <div className="w-full h-fit px-2.5">
        
        {teamMembers.length === 0 ? (
          <div className="text-grey text-sm py-4 text-center">
            No team members yet
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {teamMembers.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default TeamTab;