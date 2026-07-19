const fs = require('fs');
const path = 'E:/AI/Finance Family OS/src/pages/Portfolio.tsx';
let content = fs.readFileSync(path, 'utf8');

const dealTrackingStart = content.indexOf('      {/* Deals Tracking Section */}');
const dealTrackingEnd = content.indexOf('      {/* Gửi Tiết kiệm và Sinking Funds */}');
const dealsStr = content.substring(dealTrackingStart, dealTrackingEnd);

const savingsStart = dealTrackingEnd;
let savingsEnd = content.indexOf('    </div>\r\n  );\r\n};', savingsStart);
if (savingsEnd === -1) savingsEnd = content.indexOf('    </div>\n  );\n};', savingsStart);

const savingsStrOriginal = content.substring(savingsStart, savingsEnd);

// Modify savings to be vertical
let savingsStrNew = savingsStrOriginal.replace(
  '<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">',
  '<div className="flex flex-col gap-6 mt-6">'
);

content = content.substring(0, dealTrackingStart) + savingsStrNew + '\n' + dealsStr + content.substring(savingsEnd);
fs.writeFileSync(path, content);
console.log('Swapped successfully');
