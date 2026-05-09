const svg2img = require('svg2img');
const fs = require('fs');

const scale = 1024 / 200;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g transform="scale(${scale})">
    <rect width="200" height="200" fill="white"/>
    <circle cx="100" cy="100" r="95" fill="white" stroke="#1e3a5f" stroke-width="5"/>
    <g transform="translate(100, 70)">
      <path d="M-25,0 L-20,5 L-15,0 L-10,5 L-5,0 L0,10 L5,0 L10,5 L15,0 L20,5 L25,0 L20,20 L-20,20 Z" fill="#1e3a5f" stroke="#1e3a5f" stroke-width="2"/>
      <path d="M-25,0 L-20,5 L-15,0 L-10,5 L-5,0 L0,10" fill="none" stroke="#b8935f" stroke-width="2"/>
      <path d="M0,10 L5,0 L10,5 L15,0 L20,5 L25,0" fill="none" stroke="#b8935f" stroke-width="2"/>
    </g>
    <text x="100" y="140" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#1e3a5f" text-anchor="middle">VIDHYARTH</text>
  </g>
</svg>`;

svg2img(svg, function(error, buffer) {
  if (error) { console.error(error); process.exit(1); }
  fs.writeFileSync('../vidhyarth_app/assets/images/logo.png', buffer);
  console.log('PNG generated at ../vidhyarth_app/assets/images/logo.png');
});
