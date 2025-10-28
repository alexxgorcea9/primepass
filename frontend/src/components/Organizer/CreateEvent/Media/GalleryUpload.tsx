import React, { memo, useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import GalleryHeader from '@components/Organizer/CreateEvent/Media/GalleryHeader';
import { Plus } from 'lucide-react';

interface ThumbProps {
  selected: boolean;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  onClick: () => void;
  onRemove: () => void;
}

interface MediaData {
  id: string;
  url: string;
  file: File;
  type: 'image' | 'video';
}

interface GalleryUploadProps {
  media: MediaData[];
  setMedia: React.Dispatch<React.SetStateAction<MediaData[]>>;
}

function Thumb({ mediaUrl, mediaType, onClick }: ThumbProps) {
  return (
    <div className="flex-[0_0_22%] sm:flex-[0_0_15%] min-w-0 pl-3">
      <div className="relative group h-full">
        <button
          onClick={onClick}
          type="button"
          className="rounded-[8px] appearance-none bg-transparent touch-manipulation inline-flex no-underline cursor-pointer border-0 p-0 m-0 text-[1.8rem] font-semibold flex items-center justify-center h-24 w-full relative overflow-hidden"
        >
          {mediaType === 'image' ? (
            <img
              src={mediaUrl}
              alt="Gallery thumbnail"
              className="w-full h-full object-fill absolute inset-0"
            />
          ) : (
            <video
              src={mediaUrl}
              className="w-full h-full object-fill absolute inset-0"
              autoPlay
              loop
              muted
              playsInline
            />
          )}
        </button>
      </div>
    </div>
  );
}

function GalleryUpload({ media, setMedia }: GalleryUploadProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaMainRef, emblaMainApi] = useEmblaCarousel();
  const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
    containScroll: 'keepSnaps',
    dragFree: true,
  });

  const onThumbClick = useCallback(
    (index: number) => {
      if (!emblaMainApi || !emblaThumbsApi) return;
      emblaMainApi.scrollTo(index);
    },
    [emblaMainApi, emblaThumbsApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaMainApi || !emblaThumbsApi) return;
    setSelectedIndex(emblaMainApi.selectedScrollSnap());
    emblaThumbsApi.scrollTo(emblaMainApi.selectedScrollSnap());
  }, [emblaMainApi, emblaThumbsApi]);

  useEffect(() => {
    if (!emblaMainApi) return;
    onSelect();
    emblaMainApi.on('select', onSelect).on('reInit', onSelect);
  }, [emblaMainApi, onSelect]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newMedia: MediaData[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      file,
      type: file.type.startsWith('video/') ? 'video' : 'image',
    }));
    setMedia((prev) => [...prev, ...newMedia]);
  };

  const removeMedia = (id: string) => {
    setMedia((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      const itemToRemove = prev.find((item) => item.id === id);
      if (itemToRemove) {
        URL.revokeObjectURL(itemToRemove.url);
      }
      return filtered;
    });
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header */}
      <GalleryHeader
        assetCount={media.length}
        onAdd={handleFileUpload}
        onDelete={() => media.length > 0 && removeMedia(media[selectedIndex].id)}
      />

      {/* Carousel */}
      {media.length > 0 && (
        <div className="max-w-3xl mx-auto w-full">
          {/* Main Viewport */}
          <div className="overflow-hidden" ref={emblaMainRef}>
            <div className="flex touch-pan-y touch-pinch-zoom -ml-4">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="flex-[0_0_100%] min-w-0 pl-4"
                  style={{ transform: 'translate3d(0, 0, 0)' }}
                >
                  <div className="rounded-[1.8rem] text-6xl font-semibold flex items-center justify-center h-[19rem] select-none overflow-hidden bg-[rgba(247,247,247,0.05)]">
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt="Gallery image"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={item.url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Thumbnails */}
          <div className="mt-3">
            <div className="overflow-hidden" ref={emblaThumbsRef}>
              <div className="flex flex-row -ml-3">
                {media.map((item, index) => (
                  <Thumb
                    key={item.id}
                    selected={index === selectedIndex}
                    mediaUrl={item.url}
                    mediaType={item.type}
                    onClick={() => onThumbClick(index)}
                    onRemove={() => removeMedia(item.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {media.length === 0 && (
        <div className="w-full h-64 flex flex-col items-center justify-center text-[#B4B8B3] border-2 border-dashed border-[rgba(247,247,247,0.2)] rounded-2xl">
          <Plus className="w-12 h-12 mb-4 stroke-[#B4B8B3]" strokeWidth={1.5} />
          <p className="text-lg text-grey">No media yet</p>
          <p className="text-sm mt-1 text-grey">Click the + button to add images or videos</p>
        </div>
      )}
    </div>
  );
}

export default memo(GalleryUpload);