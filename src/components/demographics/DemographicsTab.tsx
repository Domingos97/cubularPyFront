
import { FC } from 'react';
import { 
  AgeDistributionChart, 
  GenderDistributionChart, 
  LocationDistributionChart, 
  IncomeDistributionChart, 
  AncestryDistributionChart
} from './charts';

export const DemographicsTab: FC<{ isDesktopGrid?: boolean }> = ({ isDesktopGrid = false }) => {
  // Desktop grid layout (2x2) - returns individual charts for grid placement
  if (isDesktopGrid) {
    return (
      <>
        {/* Age Distribution Chart */}
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <AgeDistributionChart />
        </div>

        {/* Gender Distribution Chart */}
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <GenderDistributionChart />
        </div>

        {/* Location Distribution Chart */}
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <LocationDistributionChart />
        </div>

        {/* Income Distribution Chart */}
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <IncomeDistributionChart />
        </div>
      </>
    );
  }

  // Original mobile/tablet layout
  return (
    <div className="space-y-4 animate-slide-up pt-2">
      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <AgeDistributionChart />
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <GenderDistributionChart />
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <LocationDistributionChart />
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <IncomeDistributionChart />
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <AncestryDistributionChart />
      </div>
    </div>
  );
};
