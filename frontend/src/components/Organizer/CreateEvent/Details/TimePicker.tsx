import React, { useEffect, useRef, useState } from 'react';

interface TimePickerProps {
  selectedHour: number;
  selectedMinute: number;
  onTimeSelect: (hour: number, minute: number, fromScroll?: boolean) => void;
  selectedDate?: Date;
}

const ITEM_HEIGHT = 40; // Height of each time item
const VISIBLE_ITEMS = 6; // Number of visible items
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS; // Total container height

const TimePicker: React.FC<TimePickerProps> = ({
  selectedHour,
  selectedMinute,
  onTimeSelect,
  selectedDate,
}) => {
  const timePickerRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const [timeOptions, setTimeOptions] = useState<
    { hour: number; minute: number; display: string }[]
  >([]);

  // Generate time options in 15-minute increments with multiple repeats for circular scrolling
  useEffect(() => {
    const options = [];
    // Create 5 sets of time options for seamless circular scrolling
    for (let set = 0; set < 5; set++) {
      for (let hour = 0; hour < 24; hour++) {
        for (let minute of [0, 15, 30, 45]) {
          const hourDisplay = hour.toString().padStart(2, '0');
          const minuteDisplay = minute.toString().padStart(2, '0');
          options.push({
            hour,
            minute,
            display: `${hourDisplay}:${minuteDisplay}`,
          });
        }
      }
    }
    setTimeOptions(options);
  }, []);

  // Scroll to selected time only on initial mount
  useEffect(() => {
    if (timePickerRef.current && timeOptions.length > 0 && !hasInitialized.current) {
      const itemsPerSet = timeOptions.length / 5;
      const middleSetStart = itemsPerSet * 2; // Start of middle (3rd) set

      // Find the index of the selected time in the middle set
      const timeIndex = timeOptions.findIndex((time, index) => {
        return (
          index >= middleSetStart &&
          index < middleSetStart + itemsPerSet &&
          time.hour === selectedHour &&
          time.minute === selectedMinute
        );
      });

      if (timeIndex !== -1) {
        // Scroll to position the selected item
        timePickerRef.current.scrollTop =
          timeIndex * ITEM_HEIGHT - (CONTAINER_HEIGHT / 2 - ITEM_HEIGHT / 2);
        hasInitialized.current = true;
      }
    }
  }, [selectedHour, selectedMinute, timeOptions]);

  // Handle scroll event for circular scrolling
  const handleScroll = () => {
    if (!timePickerRef.current || timeOptions.length === 0) return;

    const pickerElement = timePickerRef.current;
    const scrollTop = pickerElement.scrollTop;
    const itemsPerSet = timeOptions.length / 5;

    // Handle circular scrolling by jumping to equivalent position
    const centerPosition = scrollTop + CONTAINER_HEIGHT / 2;
    const currentIndex = Math.round(centerPosition / ITEM_HEIGHT);

    // If we're in the first set, jump to the third set
    if (currentIndex < itemsPerSet) {
      const equivalentIndex = currentIndex + itemsPerSet * 2;
      const newScrollTop =
        equivalentIndex * ITEM_HEIGHT -
        (CONTAINER_HEIGHT / 2 - ITEM_HEIGHT / 2);
      setTimeout(() => {
        pickerElement.scrollTop = newScrollTop;
      }, 50);
    }
    // If we're in the fifth set, jump to the third set
    else if (currentIndex >= itemsPerSet * 4) {
      const equivalentIndex = currentIndex - itemsPerSet * 2;
      const newScrollTop =
        equivalentIndex * ITEM_HEIGHT -
        (CONTAINER_HEIGHT / 2 - ITEM_HEIGHT / 2);
      setTimeout(() => {
        pickerElement.scrollTop = newScrollTop;
      }, 50);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Scrollable time list */}
      <div
        ref={timePickerRef}
        className="overflow-y-scroll scrollbar-hide"
        onScroll={handleScroll}
        style={{
          height: `${CONTAINER_HEIGHT}px`,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {timeOptions.map((time, index) => {
          const isSelected =
            time.hour === selectedHour && time.minute === selectedMinute;
          return (
            <div
              key={index}
              onClick={() => onTimeSelect(time.hour, time.minute)}
              className={`flex cursor-pointer items-center justify-center rounded-[8px] px-[10px] transition-colors ${
                isSelected
                  ? 'bg-BG-2'
                  : 'hover:bg-[var(--BG-1,rgba(247,247,247,0.08))]'
              }`}
              style={{
                height: `${ITEM_HEIGHT}px`,
              }}
            >
              <div className="font-['Lufga'] text-xs font-normal leading-[18px] text-[var(--Ivory-White,#F7F7F7)]">
                {time.display}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimePicker;
