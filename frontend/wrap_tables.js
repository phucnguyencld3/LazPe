const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Simple regex to wrap table tags. This assumes <table ...> and </table> are on their own lines or well formatted.
  // We look for <table ...> that is NOT already preceded by overflow-x-auto.
  
  // Actually, a simpler way is to find <table and </table>.
  // But we have to be careful with nested tables or multiple tables.
  
  // Replace <table className="... "> with <div className="overflow-x-auto w-full">\n<table ...>
  // Replace </table> with </table>\n</div>
  
  const tableStartRegex = /(<table[^>]*>)/g;
  const tableEndRegex = /(<\/table>)/g;

  // Check if file has <table
  if (!content.includes('<table')) return;

  // We only want to wrap if it's not already wrapped in overflow-x-auto
  if (content.includes('className="overflow-x-auto') && content.includes('<table')) {
      // It might be already wrapped. Skip to be safe.
      console.log(`Skipping ${filePath} (might be already wrapped)`);
      return;
  }

  // Count tables
  const startMatches = content.match(tableStartRegex);
  const endMatches = content.match(tableEndRegex);

  if (!startMatches || !endMatches || startMatches.length !== endMatches.length) {
      console.log(`Skipping ${filePath} (mismatched tags)`);
      return;
  }

  let offset = 0;
  let newContent = "";
  let inTable = false;
  
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    if (line.includes('<table') && !line.includes('//')) {
      const match = line.match(/^(\s*)</);
      const indent = match ? match[1] : '';
      newContent += `${indent}<div className="overflow-x-auto w-full">\n`;
      newContent += line + '\n';
    } else if (line.includes('</table') && !line.includes('//')) {
      const match = line.match(/^(\s*)</);
      const indent = match ? match[1] : '';
      newContent += line + '\n';
      newContent += `${indent}</div>\n`;
    } else {
      newContent += line + '\n';
    }
  }

  // Remove trailing newline added by split
  newContent = newContent.slice(0, -1);

  if (newContent !== originalContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

const adminPath = path.join(__dirname, 'app', '(admin)');
processDirectory(adminPath);
console.log('Done!');
