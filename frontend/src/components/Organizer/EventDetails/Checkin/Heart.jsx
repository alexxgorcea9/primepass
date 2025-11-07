import React from "react";

const Heart = (props) => (
  <svg className="coolshapes misc-5" height="100" width="100" fill="none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#cs_clip_1_misc-5)">
      <mask height="185" id="cs_mask_1_misc-5" style={{"maskType":"alpha"}} width="200" x="0" y="8" maskUnits="userSpaceOnUse">
        <path d="M145 8c30.376 0 55 25 55 60 0 70-75 110-100 125C75 178 0 138 0 68 0 33 25 8 55 8c18.6 0 35 10 45 20 10-10 26.4-20 45-20z" fill="#fff"/>
      </mask>
      <g mask="url(#cs_mask_1_misc-5)">
        <path d="M200 0H0v200h200V0z" fill="#fff"/>
        <path d="M200 0H0v200h200V0z" fill="url(#paint0_radial_748_5033)"/>
        <path d="M200 0H0v200h200V0z" fill="url(#paint1_radial_748_5033)"/>
      </g>
    </g>
    <g style={{"mixBlendMode":"overlay"}} mask="url(#cs_mask_1_misc-5)">
      <path d="M200 0H0v200h200V0z" fill="gray" stroke="transparent" filter="url(#cs_noise_1_misc-5)"/>
    </g>
    <defs>
      <radialGradient id="paint0_radial_748_5033" cx="0" cy="0" gradientTransform="rotate(116.694 71.023 87.946) scale(199.234)" gradientUnits="userSpaceOnUse" r="1">
        <stop stopColor="#F4C05F"/>
        <stop offset="1" stopColor="#D9B3E2" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="paint1_radial_748_5033" cx="0" cy="0" gradientTransform="rotate(48.452 -12.085 35.502) scale(223.143)" gradientUnits="userSpaceOnUse" r="1">
        <stop stopColor="#D9B3E2"/>
        <stop offset="0.461" stopColor="#F4C05F" stopOpacity="0.84"/>
        <stop offset="1" stopColor="#F4C05F" stopOpacity="0"/>
      </radialGradient>
      <clipPath id="cs_clip_1_misc-5">
        <path d="M0 0H200V200H0z" fill="#fff"/>
      </clipPath>
    </defs>
    <defs>
      <filter height="100%" id="cs_noise_1_misc-5" width="100%" x="0%" y="0%" filterUnits="objectBoundingBox">
        <feBlend result="out3" in="SourceGraphic" in2="out2"/>
      </filter>
    </defs>
  </svg>
);

export default Heart;