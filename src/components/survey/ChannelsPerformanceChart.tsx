import { FC } from 'react';

interface ChannelData {
  label: string;
  value: number;
  family: 'meta' | 'google' | 'dv360';
}

const channelData: ChannelData[] = [
  { label: "Meta Feed", value: 92, family: "meta" as const },
  { label: "Meta Audience Network", value: 78, family: "meta" as const },
  { label: "YouTube In-Stream", value: 89, family: "google" as const },
  { label: "Esports Streams", value: 65, family: "dv360" as const }
].sort((a, b) => b.value - a.value);

const platformColors = {
  meta: '#3B82F6',
  google: '#22C55E',
  dv360: '#A855F7'
};

const ChannelsPerformanceChart: FC = () => {
  return (
    <div className="h-full flex flex-col">
      {/* Legend - compact inline row above chart */}
      <div className="flex-none mb-3 px-4">
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#3B82F6' }}></div>
            <span className="text-white/90">Meta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#22C55E' }}></div>
            <span className="text-white/90">Google</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#A855F7' }}></div>
            <span className="text-white/90">DV360</span>
          </div>
        </div>
      </div>
      
      {/* Chart Section - 55% of card height */}
      <div className="flex-none px-4" style={{ height: '55%', overflow: 'visible' }}>
        <div className="relative h-full p-4">
          {/* X-axis grid lines and labels */}
          <div className="absolute inset-0 pointer-events-none">
            {[0, 25, 50, 75, 100].map((tick) => (
              <div
                key={tick}
                className="absolute top-0 bottom-8"
                style={{ 
                  left: `${16 + (tick * (100 - 32)) / 100}%`,
                  borderLeft: tick === 0 ? 'none' : '1px dashed #4b5563'
                }}
              >
                <span 
                  className="absolute -bottom-6 text-xs text-gray-400 transform -translate-x-1/2"
                  style={{ left: 0 }}
                >
                  {tick}%
                </span>
              </div>
            ))}
          </div>

          {/* Chart bars */}
          <div className="space-y-3 pt-2 pb-8">
            {channelData.map((channel, index) => (
              <div key={channel.label} className="relative flex items-center">
                {/* Channel label */}
                <div className="w-32 pr-4 text-right">
                  <span className="text-sm text-white/90 font-medium">
                    {channel.label}
                  </span>
                </div>
                
                {/* Bar container */}
                <div className="flex-1 relative">
                  {/* Background track */}
                  <div 
                    className="w-full h-3 rounded-md"
                    style={{ 
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: '6px'
                    }}
                  />
                  
                  {/* Filled bar */}
                  <div
                    className="absolute top-0 h-3 rounded-md transition-all duration-300"
                    style={{
                      width: `${channel.value}%`,
                      backgroundColor: platformColors[channel.family],
                      borderRadius: '6px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }}
                  />
                  
                  {/* Value label */}
                  <div
                    className="absolute top-0 h-3 flex items-center"
                    style={{
                      left: channel.value >= 40 ? `${channel.value - 8}%` : `${channel.value + 2}%`
                    }}
                  >
                    <span 
                      className="text-xs font-bold px-1"
                      style={{
                        color: channel.value >= 40 ? '#ffffff' : platformColors[channel.family]
                      }}
                    >
                      {channel.value}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Text Section - 45% of card height with 16px gap */}
      <div className="flex-1 mt-4 px-4">
        <div className="space-y-3 text-left">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#3B82F6' }}></div>
            <div className="text-white/90" style={{ fontSize: '14px' }}>
              <span className="font-semibold" style={{ color: '#3B82F6' }}>Meta:</span> Facebook Feed, Reels, Audience Network (Rewarded Video)
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#22C55E' }}></div>
            <div className="text-white/90" style={{ fontSize: '14px' }}>
              <span className="font-semibold" style={{ color: '#22C55E' }}>Google:</span> YouTube In-Stream, Display Network – sports & betting affinity audiences
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#A855F7' }}></div>
            <div className="text-white/90" style={{ fontSize: '14px' }}>
              <span className="font-semibold" style={{ color: '#A855F7' }}>Programmatic/DV360:</span> Sports news, betting forums, esports streams
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelsPerformanceChart;