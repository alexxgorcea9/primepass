import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value }) => {
  return (
    <div
      className={`relative flex h-fit w-full flex-col items-start justify-center gap-[10px] overflow-hidden rounded-[20px] px-[20px] py-[10px]`}
      style={{
        background:
          'linear-gradient(90deg, rgba(217, 179, 226, 0.3) 0%, rgba(244, 192, 95, 0.3) 100%)',
      }}
    >
      <p className='text-sm font-medium text-grey'>{title}</p>
      <h2 className='text-2xl font-bold text-white'>{value}</h2>
    </div>
  );
};

export default StatCard;
