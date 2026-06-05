/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface BrandLogoProps {
  className?: string;
}

export default function BrandLogo({ className = "w-8 h-8" }: BrandLogoProps) {
  return (
    <div className={`shrink-0 flex items-center justify-center select-none ${className}`}>
      <svg 
        viewBox="0 0 100 100" 
        width="100%" 
        height="100%" 
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
      >
        {/* White Inner Rounded Shield Background */}
        <path
          d="M 23 8 h 54 v 57 c 0 12 -10 22 -27 22 s -27 -10 -27 -22 Z"
          fill="#ffffff"
        />

        {/* Thick Outer Yellow/Gold Shield Border */}
        <path
          d="M 23 8 h 54 v 57 c 0 12 -10 22 -27 22 s -27 -10 -27 -22 Z"
          fill="none"
          stroke="#FECD04"
          strokeWidth="7"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Deep Vivid Royal Blue Left Supporting Arm */}
        <path
          d="M 28.5 17 v 32.5 l 9 12 v 15.5 h 9 v -18 L 33 40.5 v -23.5 Z"
          fill="#0012B2"
        />

        {/* Deep Vivid Royal Blue Right Supporting Arm */}
        <path
          d="M 71.5 17 v 32.5 l -9 12 v 15.5 h -9 v -18 L 67 40.5 v -23.5 Z"
          fill="#0012B2"
        />

        {/* Stylized Vibrant Red Core Heart */}
        <path
          d="M 50 26 L 43 19.5 H 37 C 35.5 19.5 34.5 20.5 34.5 22 v 11 L 50 47.5 L 65.5 33 V 22 C 65.5 20.5 64.5 19.5 63 19.5 h -6 Z"
          fill="#E40003"
        />
      </svg>
    </div>
  );
}
