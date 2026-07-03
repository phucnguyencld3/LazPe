const fs = require('fs');
const files = [
  'C:/Users/Thanh/OneDrive/Desktop/FPLOLI/DATN/SRC/V2/LazPe/frontend/app/(client)/forgot-password/page.tsx',
  'C:/Users/Thanh/OneDrive/Desktop/FPLOLI/DATN/SRC/V2/LazPe/frontend/app/(client)/login/page.tsx',
  'C:/Users/Thanh/OneDrive/Desktop/FPLOLI/DATN/SRC/V2/LazPe/frontend/app/(client)/register/page.tsx',
  'C:/Users/Thanh/OneDrive/Desktop/FPLOLI/DATN/SRC/V2/LazPe/frontend/app/(client)/reset-password/page.tsx',
  'C:/Users/Thanh/OneDrive/Desktop/FPLOLI/DATN/SRC/V2/LazPe/frontend/app/(client)/verify-otp/page.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) {
      console.log('Skipping', file, 'not found');
      return;
  }
  let content = fs.readFileSync(file, 'utf8');
  
  const lines = content.split('\n');
  const newLines = lines.map(line => {
    // Ignore video background decorators
    if (line.includes('blur-3xl')) return line;
    // GoogleLogin component props
    if (line.includes('GoogleLogin')) return line;
    
    // Replace standard border radii
    let newLine = line;
    newLine = newLine.replace(/rounded-(3xl|2xl|xl|lg|full)/g, 'rounded-[5px]');
    newLine = newLine.replace(/rounded-l-(3xl|2xl|xl|lg|full)/g, 'rounded-l-[5px]');
    newLine = newLine.replace(/rounded-r-(3xl|2xl|xl|lg|full)/g, 'rounded-r-[5px]');
    newLine = newLine.replace(/rounded-t-(3xl|2xl|xl|lg|full)/g, 'rounded-t-[5px]');
    newLine = newLine.replace(/rounded-b-(3xl|2xl|xl|lg|full)/g, 'rounded-b-[5px]');
    
    return newLine;
  });
  
  fs.writeFileSync(file, newLines.join('\n'));
  console.log('Updated', file);
});
