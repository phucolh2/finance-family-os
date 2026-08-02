const fs = require('fs');
let c = fs.readFileSync('src/components/expense/LiquidityBreakdownTable.tsx', 'utf8');

c = c.replace(
  '<span className="text-[9px] bg-red-50 text-red-600 px-1 py-0.5 rounded ml-1 border border-red-100">1 Lần</span>',
  '<span className="text-[9px] bg-red-100 text-red-600 px-1 py-0.5 rounded ml-1 border border-red-200">Tức thì</span>'
);

c = c.replace(
  '<span className="text-[9px] bg-orange-50 text-orange-600 px-1 py-0.5 rounded ml-1 border border-orange-100">Định kỳ</span>',
  '<span className="text-[9px] bg-orange-100 text-orange-600 px-1 py-0.5 rounded ml-1 border border-orange-200">Định kỳ</span>'
);

c = c.replace(
  '<span className="text-[9px] bg-red-50 text-red-600 px-1 py-0.5 rounded ml-1 border border-red-100">Định kỳ</span>',
  '<span className="text-[9px] bg-red-100 text-red-600 px-1 py-0.5 rounded ml-1 border border-red-200">Định kỳ</span>'
);

c = c.replace(
  '<span className="text-[9px] bg-emerald-50 text-emerald-600 px-1 py-0.5 rounded ml-1 border border-emerald-100">1 Lần</span>',
  '<span className="text-[9px] bg-emerald-100 text-emerald-600 px-1 py-0.5 rounded ml-1 border border-emerald-200">Tiền vào</span>'
);

// We also change "Chi tiết Trừ quỹ tức thì" back to "Chi tiết Linh hoạt"
// for consistency, since the user screenshot said "CHI TIẾT LINH HOẠT"
c = c.replace(
  '<Info className="w-3 h-3" /> Chi tiết Trừ quỹ tức thì',
  '<Info className="w-3 h-3" /> Chi tiết Linh hoạt'
);

fs.writeFileSync('src/components/expense/LiquidityBreakdownTable.tsx', c);
