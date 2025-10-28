import React, { useState, useEffect } from 'react';
import ArrowLeft from '../../../../assets/arrow-left.svg';
import ArrowRight from '../../../../assets/arrow-right.svg';

interface CalendarPickerProps {
  selectedDate: Date;
  onDateSelect: (day: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  currentMonth: number;
  currentYear: number;
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({
  selectedDate,
  onDateSelect,
  onPrevMonth,
  onNextMonth,
  currentMonth,
  currentYear,
}) => {
  const [days, setDays] = useState<number[]>([]);

  // Month names for display
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Day names for header
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

    // Create array with all days of the month
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Add empty placeholders for days before the first day of month
    const emptyDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const placeholders = Array(emptyDays).fill(null);

    setDays([...placeholders, ...daysArray]);
  }, [currentMonth, currentYear]);

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Check if a day is selected
  const isSelected = (day: number | null) => {
    if (!day) return false;

    return (
      selectedDate &&
      day === selectedDate.getDate() &&
      currentMonth === selectedDate.getMonth() &&
      currentYear === selectedDate.getFullYear()
    );
  };

  // Check if a day is in the past
  const isPastDay = (day: number | null) => {
    if (!day) return false;

    const today = new Date();
    const dayDate = new Date(currentYear, currentMonth, day);
    
    // Reset time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    dayDate.setHours(0, 0, 0, 0);
    
    return dayDate < today;
  };

  // Check if we can go to previous month
  const canGoPrevMonth = () => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    
    // Calculate what the previous month would be
    let prevYear = currentYear;
    let prevMonth = currentMonth - 1;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear = currentYear - 1;
    }
    
    // Allow if previous month/year is >= current month/year
    if (prevYear > todayYear) return true;
    if (prevYear === todayYear && prevMonth >= todayMonth) return true;
    
    return false;
  };

  return (
    <div className='flex flex-col items-center justify-start overflow-hidden'>
      {/* Month navigation */}
      <div className='flex items-center justify-between overflow-hidden px-[10px] py-[5px] w-[260px]'>
        <img
          src={ArrowLeft}
          alt='Previous month'
          className={`h-[12px] w-[12px] ${
            canGoPrevMonth() ? 'cursor-pointer' : 'cursor-not-allowed opacity-30'
          }`}
          style={{ filter: 'brightness(0) saturate(100%) invert(78%) sepia(6%) saturate(243%) hue-rotate(61deg) brightness(89%) contrast(86%)' }}
          onClick={() => canGoPrevMonth() && onPrevMonth()}
        />

        <div className="flex flex-col justify-center font-['Lufga'] text-md leading-[18px] font-normal text-[var(--Ivory-White,#F7F7F7)]">
          {monthNames[currentMonth]} {currentYear}
        </div>

        <img
          src={ArrowRight}
          alt='Next month'
          className='h-[12px] w-[12px] cursor-pointer'
          style={{ filter: 'brightness(0) saturate(100%) invert(78%) sepia(6%) saturate(243%) hue-rotate(61deg) brightness(89%) contrast(86%)' }}
          onClick={onNextMonth}
        />
      </div>

      {/* Week day headers */}
      <div className='flex items-center justify-start gap-[5px] overflow-hidden px-[10px] py-[2px] w-[260px]'>
        {dayNames.map((day, index) => (
          <div
            key={index}
            className="flex h-[30px] w-[30px] flex-col items-center justify-center text-center font-['Lufga'] text-[10px] leading-[16px] font-normal text-[var(--Grey,#B4B8B3)]"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className='flex flex-wrap items-center justify-start gap-[5px] overflow-hidden px-[10px] pb-[10px] pt-[2px] w-[260px]'>
        {days.map((day, index) => (
          <div
            key={index}
            className={`h-[30px] w-[30px] p-[8px] transition-all duration-300 ${
              day === null
                ? 'invisible'
                : isPastDay(day)
                  ? 'bg-[var(--BG-2,rgba(247,247,247,0.10))] opacity-40 cursor-not-allowed'
                  : isSelected(day)
                    ? 'bg-[var(--Accent-3,#F4C05F)]'
                    : 'bg-[var(--BG-2,rgba(247,247,247,0.20))] cursor-pointer'
            } flex flex-col items-center justify-center gap-[10px] overflow-hidden rounded-[100px]`}
            onClick={() => day !== null && !isPastDay(day) && onDateSelect(day)}
          >
            <div
              className={`flex flex-col justify-center transition-colors duration-300 ${
                isPastDay(day)
                  ? 'text-[var(--Grey,#B4B8B3)]'
                  : isSelected(day)
                    ? 'text-[var(--Onyx-Black,#0A0A0A)]'
                    : 'text-[var(--Ivory-White,#F7F7F7)]'
              } font-['Lufga'] text-[10px] leading-[16px] font-normal`}
            >
              {day !== null ? day : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarPicker;
