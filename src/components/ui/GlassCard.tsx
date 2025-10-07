import React from "react";
import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface GlassCardProps {
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ title, children, className }) => {
  return (
    <div
      className={cn(
        "bg-gray-800/25 backdrop-blur-md backdrop-saturate-150 border border-white/15 rounded-xl shadow-md p-5 h-full flex flex-col relative",
        className
      )}
    >
      <div className="h-11 flex items-center justify-between text-foreground text-base md:text-[17px] font-semibold tracking-tight border-b border-gray-700 mb-3">
        <div className="flex items-center gap-2">
          {typeof title === "string" ? <h3 className="leading-none text-white">{title}</h3> : title}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-1 hover:bg-white/10 rounded transition-colors">
              <MoreHorizontal className="w-4 h-4 text-white" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-0 bg-gray-900 border-gray-700 z-50">
            {/* Popup content placeholder */}
          </PopoverContent>
        </Popover>
      </div>
      <div className="pt-2 text-white">
        {children}
      </div>
    </div>
  );
};

export default GlassCard;
