import React, { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Auth/Button';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const gradientRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const animateGradients = () => {
      // Ensure the ref is available
      if (!gradientRef.current) return;

      // Get the SVG element
      const svg = gradientRef.current;

      // Parameters for the circular animation
      const radius1 = 20; // pixels - subtle movement
      const duration1 = 30; // seconds - slower for more subtle effect

      // Animation function for gradient 1
      let startTime = Date.now();
      let animationFrameId: number;

      const animate1 = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        const angle = (elapsed % duration1) * ((2 * Math.PI) / duration1);

        // Calculate position on circular path
        const x = Math.cos(angle) * radius1;
        const y = Math.sin(angle) * radius1;

        // Apply scale oscillation based on position in the circle
        const scale = 1.5 + 0.08 * Math.sin(angle * 2);

        // Apply the transformation
        svg.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;

        animationFrameId = requestAnimationFrame(animate1);
      };

      // Start animation
      animationFrameId = requestAnimationFrame(animate1);

      // Return cleanup function
      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    };

    // Start the animation and store the cleanup function
    return animateGradients();
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <div className="fixed inset-0 flex h-[100dvh] w-screen flex-col justify-between overflow-visible bg-BG">
      {/* SVG Gradient with cyclical animation */}
      <div className="pointer-events-none fixed inset-0 w-screen overflow-visible">
        {/* Gradient */}
        <div className="absolute bottom-[-200px] left-[calc(50%-300px)] z-0 overflow-visible">
          <svg
            ref={gradientRef}
            width="600"
            height="500"
            viewBox="-100 -100 1000 623"
            fill="none"
            overflow="visible"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transition: 'transform 0.1s linear',
              transformOrigin: 'center center',
            }}
          >
            <g filter="url(#filter1_f)">
              <path
                d="M277.668 100.434C364.502 98.5488 666.676 115.794 667.983 175.979C669.289 236.164 213.045 320.188 126.211 322.073C39.3777 323.959 202.254 313.742 200.947 253.557C199.641 193.372 190.834 102.319 277.668 100.434Z"
                fill="url(#paint1_linear)"
                fillOpacity="0.85"
              />
            </g>
            <defs>
              <filter
                id="filter1_f"
                x="0.710938"
                y="0.297363"
                width="767.273"
                height="421.981"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="BackgroundImageFix"
                  result="shape"
                />
                <feGaussianBlur
                  stdDeviation="50"
                  result="effect1_foregroundBlur"
                />
              </filter>
              <linearGradient
                id="paint1_linear"
                x1="132.666"
                y1="213.107"
                x2="668.536"
                y2="201.474"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#D9B3E2" />
                <stop offset="1" stopColor="#F4C05F" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Welcome Text - In the middle */}
      <div className="z-10 mx-auto flex w-[286px] flex-1 flex-col items-center justify-center gap-5">
        <div className="w-full text-center font-['Pacifico'] text-[40px] leading-[58px] font-normal text-white">
          Welcome to PrimePass
        </div>
        <div className="w-full text-center font-lufga text-base leading-6 font-normal text-grey">
          Experience seamless, high-end ticketing for exclusive events
        </div>
      </div>

      {/* Buttons - At the bottom */}
      <div className="z-10 mx-auto mb-6 flex w-full max-w-[440px] flex-col items-center justify-start gap-2.5 px-5 pb-[env(safe-area-inset-bottom)]">
        <div className="relative z-10 flex w-full flex-col gap-[15px]">
          <Button
            text="Login"
            variant="primary"
            onClick={useCallback(() => navigate('/login'), [navigate])}
          />
          <Button
            text="Sign Up"
            variant="secondary"
            onClick={useCallback(
              () => navigate('/select-account-type'),
              [navigate]
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default Welcome;
