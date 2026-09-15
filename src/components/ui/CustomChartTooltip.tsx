export const CustomChartTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-xl border border-family-accent/20 p-4 rounded-xl shadow-2xl animate-fade-up">
        <p className="text-xs font-bold text-family-textMuted mb-3 uppercase tracking-wider border-b border-family-accent/10 pb-2">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => {
            const formattedValue = formatter 
              ? formatter(entry.value, entry.name, entry, index, payload)
              : `${Number(entry.value).toLocaleString('vi-VN')} triệu`;
            
            return (
              <div key={`item-${index}`} className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shadow-sm" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs font-medium text-family-text">
                    {entry.name}
                  </span>
                </div>
                <span className="text-xs font-bold text-family-accent">
                  {formattedValue}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};
