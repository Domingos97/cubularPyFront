
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AudienceSectionProps {
  selectedAudience: string;
  onAudienceChange: (value: string) => void;
}

export const AudienceSection = ({ selectedAudience, onAudienceChange }: AudienceSectionProps) => {
  return (
    <div className="mt-4 pt-4 border-t border-gray-800">
      {/* Audience Selection Dropdown */}
      <div className="mb-3">
        <div className="text-[10px] font-medium text-gray-400 mb-1.5 text-left">Audience</div>
        <Select value={selectedAudience} onValueChange={onAudienceChange}>
          <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-[10px] text-gray-300 h-7">
            <SelectValue placeholder="Select audience" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="holiday" className="text-[10px] text-gray-300">holiday</SelectItem>
            <SelectItem value="all" className="text-[10px] text-gray-300">all</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
