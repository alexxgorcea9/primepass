import { useParams } from 'react-router-dom';
import { useSpecialRequestDetail } from '@hooks/useConcierge';
import RequestDetailHeader from '@components/Organizer/EventDetails/Concierge/RequestDetailHeader';
import FirstLine from '@/assets/firstline.svg';

const RequestDetails =() => {

  const { request_id } = useParams<{ request_id: string }>();
  const requestId = Number(request_id);
  const { data: request, isLoading, error } = useSpecialRequestDetail(requestId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading request</div>;
  if (!request) return <div>Request not found</div>;

  return (
    <div className="fixed inset-0">
      <RequestDetailHeader title={request.title} />

      {/* Description */}
      <div className="self-stretch p-2.5 rounded-[20px] inline-flex flex-col justify-end items-start gap-2.5 overflow-hidden">
        <div className="self-stretch p-2.5 inline-flex justify-start items-center gap-2.5 overflow-hidden">
          <img src={FirstLine} alt="FirstLine" className="w-6 h-6" />
          <div className="justify-center text-Ivory-White text-base font-normal font-['Lufga'] leading-6">Description
          </div>
        </div>
        <div
          className="self-stretch p-2.5 rounded-[20px] flex flex-col justify-start items-start gap-2.5 overflow-hidden">
          <div
            className="self-stretch justify-center text-Ivory-White text-xs font-normal font-['Lufga'] leading-4">
            {request.description}
          </div>
        </div>
      </div>



    </div>
  );
};

export default RequestDetails;