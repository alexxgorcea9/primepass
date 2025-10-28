export const TIER_GRADIENTS = [
  {
    id: 'grey',
    name: 'Grey',
    from: '#B4B8B3',
    to: '#B4B8B3',
    className: 'from-[#B4B8B3] to-[#B4B8B3]'
  },
  {
    id: 'white',
    name: 'White',
    from: '#F7F7F7',
    to: '#F7F7F7',
    className: 'from-[#F7F7F7] to-[#F7F7F7]'
  },
  {
    id: 'ruby',
    name: 'Ruby',
    from: '#EC008C',
    to: '#FC6767',
    className: 'from-[#EC008C] to-[#FC6767]'
  },
  {
    id: 'emerald',
    name: 'Emerald',
    from: '#A8FF78',
    to: '#78FFD6',
    className: 'from-[#A8FF78] to-[#78FFD6]'
  },
  {
    id: 'gold',
    name: 'Gold',
    from: '#FFD773',
    to: '#FF954A',
    className: 'from-[#FFD773] to-[#FF954A]'
  },
  {
    id: 'purple',
    name: 'Purple',
    from: '#7F00FF',
    to: '#E100FF',
    className: 'from-[#7F00FF] to-[#E100FF]'
  },
  {
    id: 'sky',
    name: 'Sky',
    from: '#7F7FD5',
    via: '#86A8E7',
    to: '#91EAE4',
    className: 'from-[#7F7FD5] via-[#86A8E7] to-[#91EAE4]'
  },
  {
    id: 'diamond',
    name: 'Diamond',
    from: '#B2FEFA',
    to: '#0ED2F7',
    className: 'from-[#B2FEFA] to-[#0ED2F7]'
  }
] as const;

export type TierGradient = typeof TIER_GRADIENTS[number];
