import React, { useState, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth } from 'date-fns';

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value = '',
  onChange,
  name,
  label,
  required = false,
  error,
  className,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

  // Detect if device is mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Only check user agent for true mobile devices, not window width
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    
    checkMobile();
    // No need for resize listener since we're not checking window width
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsMonthOpen(false);
        setIsYearOpen(false);
      }
      if (monthRef.current && !monthRef.current.contains(event.target as Node)) {
        setIsMonthOpen(false);
      }
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) {
        setIsYearOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentMonth(new Date(selectedYear, selectedMonth));
  }, [selectedYear, selectedMonth]);

  const handleSelect = (date: Date) => {
    setSelectedDate(date);
    if (onChange) {
      onChange(format(date, 'yyyy-MM-dd'));
    }
    setIsOpen(false);
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getFirstDayOfMonth = () => {
    return startOfMonth(currentMonth).getDay();
  };

  const outlineColor = error 
    ? '#FF5151' 
    : isFocused || isOpen
      ? 'rgba(247,247,247,1)' 
      : 'rgba(247,247,247,0.2)';

  // If mobile, render native date input
  if (isMobile) {
    return (
      <div className={`flex w-full flex-col gap-1 ${className || ''}`}>
        {label && (
          <label className='mb-2 block pl-4 font-[Lufga] text-xs text-[rgba(247,247,247,0.6)]'>
            {label}
          </label>
        )}
        <input
          type='date'
          name={name}
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          required={required}
          className='h-[45px] w-full rounded-[20px] bg-transparent px-5 font-[Lufga] text-base font-normal text-white outline outline-[0.5px] transition-all duration-200'
          style={{ 
            outlineColor,
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            appearance: 'none',
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {error && (
          <p className='pl-4 font-[Lufga] text-xs text-[#FF5151]'>{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex w-full flex-col gap-1 ${className || ''}`}>
      {label && (
        <label className='mb-2 block pl-4 font-[Lufga] text-xs text-[rgba(247,247,247,0.6)]'>
          {label}
        </label>
      )}
      
      <div className='relative w-full' ref={popoverRef}>
        {/* Popover */}
        {isOpen && (
          <div className='absolute left-0 bottom-[calc(100%+8px)] z-[100] w-80 rounded-[20px] bg-[#0A0A0A] p-4 shadow-2xl outline outline-[0.5px] outline-[rgba(247,247,247,0.2)]'>
            <style>{`
              .custom-dropdown-list {
                scrollbar-width: none;
                -ms-overflow-style: none;
              }
              .custom-dropdown-list::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {/* Month/Year Selectors */}
            <div className='mb-4 flex items-center justify-center gap-3'>
              {/* Month Dropdown */}
              <div className='relative flex-1' ref={monthRef}>
                <button
                  type="button"
                  onClick={() => setIsMonthOpen(!isMonthOpen)}
                  className='flex w-full items-center justify-between rounded-xl border-0 bg-transparent px-4 py-2.5 font-[Lufga] text-sm font-medium text-white outline-none ring-1 ring-[rgba(247,247,247,0.15)] transition-all duration-200 hover:ring-[rgba(247,247,247,0.3)]'
                >
                  {format(new Date(2000, selectedMonth), 'MMMM')}
                  <svg className={`h-3 w-3 transition-transform ${isMonthOpen ? 'rotate-180' : ''}`} fill='none' stroke='rgba(247,247,247,0.6)' strokeWidth='2.5' viewBox='0 0 24 24'>
                    <path d='M6 9l6 6 6-6' />
                  </svg>
                </button>
                {isMonthOpen && (
                  <div className='custom-dropdown-list absolute left-0 top-full z-50 mt-2 max-h-48 w-full overflow-y-auto rounded-xl bg-[#1A1A1A] py-1 shadow-xl ring-1 ring-[rgba(247,247,247,0.2)]'>
                    {Array.from({ length: 12 }, (_, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setSelectedMonth(i);
                          setIsMonthOpen(false);
                        }}
                        className={`cursor-pointer px-4 py-2 font-[Lufga] text-sm transition-colors ${
                          selectedMonth === i
                            ? 'bg-[rgba(247,247,247,0.15)] text-white font-medium'
                            : 'text-[rgba(247,247,247,0.8)] hover:bg-[rgba(247,247,247,0.08)] hover:text-white'
                        }`}
                      >
                        {format(new Date(2000, i), 'MMMM')}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Year Dropdown */}
              <div className='relative w-28' ref={yearRef}>
                <button
                  type="button"
                  onClick={() => setIsYearOpen(!isYearOpen)}
                  className='flex w-full items-center justify-between rounded-xl border-0 bg-transparent px-4 py-2.5 font-[Lufga] text-sm font-medium text-white outline-none ring-1 ring-[rgba(247,247,247,0.15)] transition-all duration-200 hover:ring-[rgba(247,247,247,0.3)]'
                >
                  {selectedYear}
                  <svg className={`h-3 w-3 transition-transform ${isYearOpen ? 'rotate-180' : ''}`} fill='none' stroke='rgba(247,247,247,0.6)' strokeWidth='2.5' viewBox='0 0 24 24'>
                    <path d='M6 9l6 6 6-6' />
                  </svg>
                </button>
                {isYearOpen && (
                  <div className='custom-dropdown-list absolute left-0 top-full z-50 mt-2 max-h-48 w-full overflow-y-auto rounded-xl bg-[#1A1A1A] py-1 shadow-xl ring-1 ring-[rgba(247,247,247,0.2)]'>
                    {Array.from({ length: new Date().getFullYear() - 1899 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <div
                          key={year}
                          onClick={() => {
                            setSelectedYear(year);
                            setIsYearOpen(false);
                          }}
                          className={`cursor-pointer px-4 py-2 font-[Lufga] text-sm transition-colors ${
                            selectedYear === year
                              ? 'bg-[rgba(247,247,247,0.15)] text-white font-medium'
                              : 'text-[rgba(247,247,247,0.8)] hover:bg-[rgba(247,247,247,0.08)] hover:text-white'
                          }`}
                        >
                          {year}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Calendar */}
            <div>
              {/* Weekday headers */}
              <div className='mb-2 grid grid-cols-7 gap-1'>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div
                    key={day}
                    className='flex h-8 items-center justify-center font-[Lufga] text-[10px] font-medium uppercase text-[rgba(247,247,247,0.4)]'
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className='grid grid-cols-7 gap-1'>
                {/* Empty cells for days before month starts */}
                {Array.from({ length: getFirstDayOfMonth() }).map((_, i) => (
                  <div key={`empty-${i}`} className='h-8' />
                ))}

                {/* Days of the month */}
                {getDaysInMonth().map(day => {
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);

                  return (
                    <button
                      key={day.toString()}
                      onClick={() => handleSelect(day)}
                      className={`flex h-8 w-full items-center justify-center rounded-lg font-[Lufga] text-xs transition-all duration-200 ${
                        isSelected
                          ? 'bg-white text-[#0A0A0A] font-medium'
                          : isTodayDate
                          ? 'bg-[rgba(247,247,247,0.08)] text-white'
                          : isCurrentMonth
                          ? 'text-[rgba(247,247,247,0.8)] hover:bg-[rgba(247,247,247,0.05)] hover:text-white'
                          : 'text-[rgba(247,247,247,0.3)]'
                      }`}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        <div
          className='flex h-[45px] w-full items-center overflow-hidden rounded-[20px] transition-all duration-200'
          style={{
            outline: `0.5px solid ${outlineColor}`,
          }}
        >
          <input
            type='text'
            name={name}
            value={selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
            readOnly
            required={required}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onClick={() => setIsOpen(!isOpen)}
            placeholder=''
            className='h-full flex-1 cursor-pointer bg-transparent px-4 font-[Lufga] text-base font-normal text-white outline-none'
          />
          
          <div 
            className='flex h-full cursor-pointer items-center px-4'
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg
              className={`h-3 w-3 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill='none'
              stroke='rgba(247,247,247,0.6)'
              strokeWidth='2.5'
              viewBox='0 0 24 24'
            >
              <path d='M6 9l6 6 6-6' />
            </svg>
          </div>
        </div>
      </div>
      
      {error && (
        <p className='pl-4 font-[Lufga] text-xs text-[#FF5151]'>{error}</p>
      )}
    </div>
  );
};

export default DatePicker;
