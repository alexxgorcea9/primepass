import React from 'react';
import { memo } from 'react';
import { Plus } from 'lucide-react';
import Trash from '@/assets/trash.svg';
import Image from '@/assets/image.svg';

interface GalleryHeaderProps {
  assetCount: number;
  onAdd: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: () => void;
}

function GalleryHeader({ assetCount, onAdd, onDelete }: GalleryHeaderProps) {
  return (
    <div className="w-full self-stretch p-2.5 inline-flex justify-between items-center overflow-hidden">
      <div className="flex justify-center items-center overflow-hidden">
        <div className="w-12 h-12 bg-[#F7F7F7] rounded-full inline-flex flex-col justify-center items-center gap-2.5 overflow-hidden">
          <img src={Image} alt="Image" className="w-4 h-4 object-contain" />
        </div>

        <div className="p-2.5 inline-flex flex-col justify-start items-start overflow-hidden">
          <div className="justify-center text-[#B4B8B3] text-base font-normal leading-none">
            Event Gallery
          </div>
          <div className="justify-center text-[#F7F7F7] text-2xl leading-none mt-1">
            {assetCount} {assetCount === 1 ? 'Asset' : 'Assets'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Delete Button */}
        {assetCount > 0 && (
          <button
            onClick={onDelete}
            className="w-12 h-12 bg-red-600/20 rounded-full flex justify-center items-center overflow-hidden hover:bg-red-600/30 transition-colors shrink-0"
          >
            <img
              src={Trash}
              alt="Delete"
              className="w-4 h-4 object-contain"
            />
          </button>
        )}

        {/* Add Button */}
        <label className="w-12 h-12 p-2.5 bg-[rgba(247,247,247,0.20)] rounded-full inline-flex flex-col justify-center items-center gap-2.5 overflow-hidden hover:bg-[rgba(247,247,247,0.30)] transition-colors cursor-pointer">
          <Plus className="w-4 h-4 text-[#F7F7F7]" strokeWidth={1.5} />
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={onAdd}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}

export default memo(GalleryHeader);