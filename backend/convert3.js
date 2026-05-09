const sharp = require('sharp');
const fs = require('fs');

// We add a 60-pixel padding on all sides to fit within Android's Adaptive Icon "Safe Zone" (the inner 66%).
// The original viewBox was 0 0 200 200.
// New viewBox is -60 -60 320 320, meaning the content takes up 200/320 = 62.5% of the frame.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-60 -60 320 320">
  <rect x="-60" y="-60" width="320" height="320" fill="white"/>
  <circle cx="100" cy="100" r="95" fill="white" stroke="#1e3a5f" stroke-width="5"/>
  <g transform="translate(100, 70)">
    <!-- Book icon -->
    <path d="M-25,0 L-20,5 L-15,0 L-10,5 L-5,0 L0,10 L5,0 L10,5 L15,0 L20,5 L25,0 L20,20 L-20,20 Z" 
          fill="#1e3a5f" stroke="#1e3a5f" stroke-width="2"/>
    <path d="M-25,0 L-20,5 L-15,0 L-10,5 L-5,0 L0,10" 
          fill="none" stroke="#b8935f" stroke-width="2"/>
    <path d="M0,10 L5,0 L10,5 L15,0 L20,5 L25,0" 
          fill="none" stroke="#b8935f" stroke-width="2"/>
  </g>
  <text x="100" y="140" font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
        fill="#1e3a5f" text-anchor="middle">VIDHYARTH</text>
</svg>`;

sharp(Buffer.from(svg))
  .resize(1024, 1024)
  .png()
  .toFile('../vidhyarth_app/assets/images/logo.png')
  .then(info => console.log('Successfully generated safely padded logo.png:', info))
  .catch(err => console.error('Error generating png:', err));
