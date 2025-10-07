
import { FC } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList, ResponsiveContainer } from 'recharts';
import { ChartTooltip } from "@/components/ui/chart";
import { DollarSign } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";
import { InteractiveTooltip } from "@/components/ui/interactive-tooltip";
import { Info } from 'lucide-react';

// Income Distribution Data
const incomeData = [
  { name: '<30k', value: 18 },
  { name: '30k-75k', value: 45 },
  { name: '75k-120k', value: 25 },
  { name: '>120k', value: 12 },
];

// Color ranges for charts
const incomeColors = ['#C4B5FD', '#A78BFA', '#8B5CF6', '#7C3AED'];

export const IncomeDistributionChart: FC = () => {
  const searchTerm = sessionStorage.getItem('searchTerm') || 'this topic';
  const { isMobile, width } = useIsMobile();
  
  // Calculate responsive dimensions
  const getFontSize = () => width < 375 ? 10 : width < 450 ? 11 : 13;
  const getLabelFontSize = () => width < 375 ? 10 : width < 450 ? 12 : 14;
  const getChartHeight = () => width < 375 ? 200 : width < 768 ? 240 : 260;
  
  // Return a properly typed radius value for Bar components
  const getBarRadius = (): [number, number, number, number] => [6, 6, 0, 0];

  return (
    <div className="p-5 bg-gray-900 rounded-xl border border-gray-800 relative">
      <InteractiveTooltip 
        content={`Income analysis shows ${searchTerm} resonates most with middle-income groups (30k-75k), comprising 45% of respondents.`}
        searchTerm={searchTerm}
      >
        <button className="absolute top-3 right-3 z-10">
          <Info className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-300 transition-colors" />
        </button>
      </InteractiveTooltip>
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-4 h-4 text-gray-400" />
        <h3 className="text-base font-semibold text-white">Income Distribution</h3>
      </div>
      <div style={{ height: `${getChartHeight()}px` }} className="w-full overflow-visible">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={incomeData}
            margin={{ top: 20, right: 10, left: 10, bottom: 30 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="name"
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: getFontSize(), fill: '#D1D5DB', fontWeight: 500 }}
              dy={5}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 'dataMax + 5']}
              tick={{ fontSize: getFontSize(), fill: '#9CA3AF', fontWeight: 500 }}
              width={35}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-gray-800 px-3 py-2 border border-gray-700 rounded-lg text-sm shadow-lg">
                      <p className="text-white font-medium">{`${payload[0].payload.name}: ${payload[0].value}%`}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="value" 
              radius={getBarRadius()}
              minPointSize={22}
            >
              {incomeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={incomeColors[index]} />
              ))}
              <LabelList 
                dataKey="value" 
                position="top" 
                formatter={(value: number) => `${value}%`}
                style={{ 
                  fill: 'white', 
                  fontSize: getLabelFontSize(), 
                  fontWeight: 600,
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}
                offset={8}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
