const localtunnel = require('localtunnel');

async function startTunnel() {
  console.log('Starting tunnel...');
  try {
    const tunnel = await localtunnel({ port: 5001, subdomain: 'vidhyarth-kiro-api' });
    console.log('Tunnel running at:', tunnel.url);

    tunnel.on('close', () => {
      console.log('Tunnel closed! Restarting in 3 seconds...');
      setTimeout(startTunnel, 3000);
    });

    tunnel.on('error', (err) => {
      console.log('Tunnel error:', err);
    });
  } catch (err) {
    console.log('Failed to start tunnel:', err);
    setTimeout(startTunnel, 3000);
  }
}

startTunnel();
