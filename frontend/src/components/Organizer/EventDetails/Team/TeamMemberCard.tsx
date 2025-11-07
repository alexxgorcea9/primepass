import { TeamMember } from '@/api/events';
import Message from '@/assets/sms.svg';

interface TeamMemberCardProps {
  member: TeamMember;
}

const TeamMemberCard = ({ member }: TeamMemberCardProps) => {
  return (
    <div className="self-stretch p-2.5 bg-gradient-to-r from-Accent-2/30 to-Accent-3/30 rounded-[20px] inline-flex flex-col justify-start items-start gap-2.5 overflow-hidden">
      <div className="self-stretch inline-flex justify-between items-center overflow-hidden">
        <div className=" rounded-[40px] backdrop-blur-[20px] flex justify-center items-center overflow-hidden">
          {member.profilePicture ? (
            <img 
              className="w-12 h-12 relative rounded-full object-cover" 
              src={member.profilePicture}
              alt={member.name || member.email}
            />
          ) : (
            <div className="w-12 h-12 relative rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-white text-lg font-semibold">
                {(member.name || member.email).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="p-2.5 inline-flex flex-col justify-start items-start overflow-hidden">
            <div className="justify-center text-Platinum-Grey text-xs font-normal font-['Lufga'] leading-4">Staff</div>
            <div className="justify-center text-Ivory-White text-base font-normal font-['Lufga'] leading-6">
              {member.name || 'No name'}
            </div>
          </div>
        </div>

        <div className=" rounded-[40px] backdrop-blur-[20px] flex justify-center items-center gap-2.5 overflow-hidden">
          <div className="w-12 h-12 p-2.5 bg-BG-2 rounded-full inline-flex flex-col justify-center items-center gap-2.5 overflow-hidden">
            <img src={Message} alt="Message" className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberCard;
