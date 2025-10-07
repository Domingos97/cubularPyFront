
import { FC } from 'react';
import { MapPin } from 'lucide-react';
import { InteractiveTooltip } from "@/components/ui/interactive-tooltip";
import { Info } from 'lucide-react';
import DemographicsMap from "../../DemographicsMap";

export const GeographicDistributionMap: FC = () => {
  const searchTerm = sessionStorage.getItem('searchTerm') || 'this topic';

  return (
    <div className="p-2 sm:p-4 bg-gray-900 rounded-lg border border-gray-800 relative">
      <InteractiveTooltip 
        content={`Geographic heatmap visualizes where ${searchTerm} has the most engagement, with hotspots in Europe and North America.`}
        searchTerm={searchTerm}
      >
        <button className="absolute top-2 right-2 z-10">
          <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
        </button>
      </InteractiveTooltip>
      <div className="flex items-center gap-1.5 mb-2">
        <MapPin className="w-3.5 h-3.5 text-gray-400" />
        <h3 className="text-xs font-semibold text-white">Geographic Distribution</h3>
      </div>
      <DemographicsMap />
    </div>
  );
};
