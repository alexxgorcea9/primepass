import React from "react";

const Dots = (props) => (
  <svg className="coolshapes ellipse-8 " height="100" width="100" fill="none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#cs_clip_1_ellipse-8)">
      <mask height="200" id="cs_mask_1_ellipse-8" style={{"maskType":"alpha"}} width="200" x="0" y="0" maskUnits="userSpaceOnUse">
        <path d="M139 39c0 21.54-17.461 39-39 39-21.54 0-39-17.46-39-39S78.46 0 100 0c21.539 0 39 17.46 39 39zM139 161c0 21.539-17.461 39-39 39-21.54 0-39-17.461-39-39s17.46-39 39-39c21.539 0 39 17.461 39 39zM161 139c-21.539 0-39-17.461-39-39 0-21.54 17.461-39 39-39s39 17.46 39 39c0 21.539-17.461 39-39 39zM39 139c-21.54 0-39-17.461-39-39 0-21.54 17.46-39 39-39s39 17.46 39 39c0 21.539-17.46 39-39 39z" fill="#fff"/>
      </mask>
      <g mask="url(#cs_mask_1_ellipse-8)">
        <path d="M200 0H0v200h200V0z" fill="#fff"/>
        <path d="M200 0H0v200h200V0z" fill="url(#paint0_linear_748_4745)" fillOpacity="0.55"/>
        <g filter="url(#filter0_f_748_4745)">
          <path d="M213 69H93v141h120V69z" fill="#06F"/>
        </g>
      </g>
    </g>
    <g style={{"mixBlendMode":"overlay"}} mask="url(#cs_mask_1_ellipse-8)">
      <path d="M200 0H0v200h200V0z" fill="gray" stroke="transparent" filter="url(#cs_noise_1_ellipse-8)"/>
    </g>
    <defs>
      <filter height="266" id="filter0_f_748_4745" width="245" x="30.5" y="6.5" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood result="BackgroundImageFix" floodOpacity="0"/>
        <feBlend result="shape" in="SourceGraphic" in2="BackgroundImageFix"/>
        <feGaussianBlur result="effect1_foregroundBlur_748_4745" stdDeviation="31.25"/>
      </filter>
      <linearGradient id="paint0_linear_748_4745" gradientUnits="userSpaceOnUse" x1="162" x2="49.5" y1="38" y2="150.5">
        <stop stopColor="#FF1F00"/>
        <stop offset="1" stopColor="#FF58E4"/>
      </linearGradient>
      <clipPath id="cs_clip_1_ellipse-8">
        <path d="M0 0H200V200H0z" fill="#fff"/>
      </clipPath>
    </defs>
    <defs>
      <filter height="100%" id="cs_noise_1_ellipse-8" width="100%" x="0%" y="0%" filterUnits="objectBoundingBox">
        <feBlend result="out3" in="SourceGraphic" in2="out2"/>
      </filter>
    </defs>
  </svg>
);

export default Dots;
