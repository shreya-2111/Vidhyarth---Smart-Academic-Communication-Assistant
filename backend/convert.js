const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="white"/>
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

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head><style>body { margin: 0; padding: 0; background: transparent; }</style></head>
    <body>
      <div id="svg-container" style="width: 1024px; height: 1024px;">
        ${svg.replace('viewBox="0 0 200 200"', 'viewBox="0 0 200 200" width="1024" height="1024"')}
      </div>
    </body>
    </html>
  `);

  const element = await page.$('#svg-container');
  await element.screenshot({ path: '../vidhyarth_app/assets/images/logo.png', omitBackground: true });
  
  await browser.close();
  console.log('PNG generated at ../vidhyarth_app/assets/images/logo.png');
})();
