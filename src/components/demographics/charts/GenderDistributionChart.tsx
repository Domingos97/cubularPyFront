
import { FC } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { ChartTooltip } from "@/components/ui/chart";
import { Users } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";
import { InteractiveTooltip } from "@/components/ui/interactive-tooltip";
import { Info } from 'lucide-react';

// Gender Distribution Data
const genderData = [
  { name: 'Male', value: 48, fill: '#4F46E5' },
  { name: 'Female', value: 51, fill: '#9B87F5' },
  { name: 'Other', value: 1, fill: '#6B7280' },
];

export const GenderDistributionChart: FC = () => {
  const searchTerm = sessionStorage.getItem('searchTerm') || 'this topic';
  const { isMobile, width } = useIsMobile();

  // Calculate center label value
  const totalValue = genderData.reduce((sum, item) => sum + item.value, 0);
  const predominantGender = genderData.find(item => item.value > 50) || genderData[0];

  const renderCustomLabel = (entry: any) => {
    if (entry.value < 5) return null;
    return `${entry.value}%`;
  };

  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex justify-center mt-3">
        <div className="flex flex-wrap gap-3 text-xs">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-300 font-medium">
                {entry.value}: {genderData[index]?.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-5 bg-gray-900 rounded-xl border border-gray-800 relative">
      <InteractiveTooltip 
        content={`Gender analysis reveals that ${searchTerm} slightly appeals more to ${predominantGender.name.toLowerCase()}s (${predominantGender.value}%).`}
        searchTerm={searchTerm}
      >
        <button className="absolute top-3 right-3 z-10">
          <Info className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-300 transition-colors" />
        </button>
      </InteractiveTooltip>
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-gray-400" />
        <h3 className="text-base font-semibold text-white">Gender Distribution</h3>
      </div>
      <div className="h-[240px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={genderData}
              cx="50%"
              cy="45%"
              innerRadius={40}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={renderCustomLabel}
            >
              {genderData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-gray-800 px-3 py-2 border border-gray-700 rounded-lg text-sm shadow-lg">
                      <p className="text-white font-medium">{`${payload[0].name}: ${payload[0].value}%`}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{totalValue}%</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
        </div>
      </div>
      
      {/* Custom Legend */}
      <div className="flex justify-center mt-2">
        <div className="flex flex-wrap gap-4 text-sm">
          {genderData.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.fill }}
              />
              <span className="text-gray-300 font-medium">
                {entry.name}: {entry.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
