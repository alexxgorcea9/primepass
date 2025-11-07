import CheckinHeader from '@components/Organizer/EventDetails/Checkin/CheckinHeader';

const CheckinTab = () => {

  return (
    <>
      <div className="h-full w-full pt-[5rem] overflow-y-auto [&::-webkit-scrollbar]:hidden">
        <CheckinHeader />
      </div>
    </>
  );
};

export default CheckinTab;