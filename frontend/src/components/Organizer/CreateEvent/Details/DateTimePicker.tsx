import React, { useRef, useState } from 'react';
import CalendarPicker from './CalendarPicker';
import TimePicker from './TimePicker';
import CalendarIcon from '../../../../assets/calendar.svg';

interface DateTimePickerProps {
  selectedDate: Date;
  onDateTimeChange: (date: Date) => void;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  selectedDate,
  onDateTimeChange,
}) => {
  const calendarRef = useRef<HTMLDivElement>(null);
  const timePickerRef = useRef<HTMLDivElement>(null);

  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  const [selectedHour, setSelectedHour] = useState(selectedDate.getHours());
  const [selectedMinute, setSelectedMinute] = useState(
    Math.floor(selectedDate.getMinutes() / 15) * 15
  );

  const handleDateSelect = (day: number) => {
    const newDate = new Date(
      currentYear,
      currentMonth,
      day,
      selectedHour,
      selectedMinute
    );
    onDateTimeChange(newDate);
  };

  const handleTimeSelect = (hour: number, minute: number, fromScroll?: boolean) => {
    const newDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      hour,
      minute
    );

    // Prevent selecting past times for today
    const now = new Date();
    if (
      newDate.getDate() === now.getDate() &&
      newDate.getMonth() === now.getMonth() &&
      newDate.getFullYear() === now.getFullYear()
    ) {
      // If it's today, check if time is in the past
      if (newDate < now) {
        // Don't update to past time
        return;
      }
    }

    setSelectedHour(hour);
    setSelectedMinute(minute);
    onDateTimeChange(newDate);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div className='flex flex-col items-start justify-start gap-[10px] self-stretch overflow-hidden rounded-[20px] bg-gradient-accent p-[10px]'>
      <div className='inline-flex items-center justify-start gap-[10px] self-stretch overflow-hidden p-[10px]'>
        <div className='relative h-[16px] w-[16px]'>
          <img src={CalendarIcon} alt='Calendar' className='h-full w-full' />
        </div>
        <div className="text-Ivory-White flex w-[100px] flex-col justify-center font-['Lufga'] text-md leading-[18px] font-normal">
          Date/Time
        </div>
      </div>

      <div className='inline-flex items-start justify-between gap-[10px] self-stretch overflow-hidden'>
        {/* Calendar */}
        <div
          ref={calendarRef}
          className='inline-flex flex-col items-center justify-start gap-[10px] overflow-hidden'
        >
          <CalendarPicker
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            currentMonth={currentMonth}
            currentYear={currentYear}
          />
        </div>

        {/* Time Picker */}
        <div
          ref={timePickerRef}
          className='flex h-auto flex-col items-center justify-start gap-[10px] self-stretch overflow-hidden pt-2.5 pr-5 pb-2.5 pl-5'
        >
          <TimePicker
            selectedHour={selectedHour}
            selectedMinute={selectedMinute}
            onTimeSelect={handleTimeSelect}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    </div>
  );
};

export default DateTimePicker;
