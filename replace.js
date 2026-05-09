const fs = require('fs');
const path = require('path');

function findAndReplace(dir, searchRegex, replaceString) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findAndReplace(fullPath, searchRegex, replaceString);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.match(searchRegex)) {
        content = content.replace(searchRegex, replaceString);
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

findAndReplace(path.join(__dirname, 'frontend/src'), /http:\/\/localhost:5001/g, 'https://backend-beryl-pi.vercel.app');
