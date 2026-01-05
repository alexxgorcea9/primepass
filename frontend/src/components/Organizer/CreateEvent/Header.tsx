import { useNavigate } from 'react-router-dom';
import ArrowLeft from '@/assets/arrow-left.svg';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="w-full py-2.5 flex items-center gap-2.5">
      <button
        onClick={() => navigate(-1)}
        className="w-12 h-12 p-2.5 bg-[rgba(247,247,247,0.05)] rounded-full flex justify-center items-center cursor-pointer"
      >
        <img src={ArrowLeft} alt="ArrowLeft" className="w-4 h-4 object-contain" />
      </button>
      <h1 className="text-white text-xl font-Lufga font-bold leading-6">
        {title}
      </h1>
    </div>
  );
}
