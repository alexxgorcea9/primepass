import React from "react";

const X = (props) => (
  <svg className="coolshapes rectangle-9 " height="100" width="100" fill="none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#cs_clip_1_rectangle-9)">
      <mask height="200" id="cs_mask_1_rectangle-9" style={{"maskType":"alpha"}} width="200" x="0" y="0" maskUnits="userSpaceOnUse">
        <path d="M100 139.678L39.678 200 0 160.322 60.322 100 0 39.678 39.678 0 100 60.322 160.322 0 200 39.678 139.678 100 200 160.322 160.322 200 100 139.678z" fill="#fff"/>
      </mask>
      <g mask="url(#cs_mask_1_rectangle-9)">
        <path d="M200 0H0v200h200V0z" fill="#fff"/>
        <path d="M200 0H0v200h200V0z" fill="url(#paint0_linear_844_2853)"/>
        <g filter="url(#filter0_f_844_2853)">
          <path d="M95 46H-12v154H95V46z" fill="#FF37BB"/>
          <path d="M212 0H79v110h133V0z" fill="#00F0FF"/>
        </g>
      </g>
    </g>
    <g style={{"mixBlendMode":"overlay"}} mask="url(#cs_mask_1_rectangle-9)">
      <path d="M200 0H0v200h200V0z" fill="gray" stroke="transparent" filter="url(#cs_noise_1_rectangle-9)"/>
    </g>
    <defs>
      <filter height="360" id="filter0_f_844_2853" width="384" x="-92" y="-80" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood result="BackgroundImageFix" floodOpacity="0"/>
        <feBlend result="shape" in="SourceGraphic" in2="BackgroundImageFix"/>
        <feGaussianBlur result="effect1_foregroundBlur_844_2853" stdDeviation="40"/>
      </filter>
      <linearGradient id="paint0_linear_844_2853" gradientUnits="userSpaceOnUse" x1="158.5" x2="29" y1="12.5" y2="200">
        <stop stopColor="#0E6FFF"/>
        <stop offset="1" stopColor="#0B9DFF"/>
      </linearGradient>
      <clipPath id="cs_clip_1_rectangle-9">
        <path d="M0 0H200V200H0z" fill="#fff"/>
      </clipPath>
    </defs>
    <defs>
      <filter height="100%" id="cs_noise_1_rectangle-9" width="100%" x="0%" y="0%" filterUnits="objectBoundingBox">
        <feBlend result="out3" in="SourceGraphic" in2="out2"/>
      </filter>
    </defs>
  </svg>
);

export default X;
