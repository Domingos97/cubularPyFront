
import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"
import { ChartContext } from "./chart-context"
import { ChartStyle } from "./chart-style"
import { ChartConfig } from "./types"

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex w-full aspect-auto justify-center text-[10px] sm:text-xs md:text-sm min-h-[220px] sm:min-h-[260px] bg-gray-900 [&_.recharts-cartesian-axis-tick_text]:fill-gray-300 [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-gray-600/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-gray-600 [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-gray-600 [&_.recharts-radial-bar-background-sector]:fill-gray-800 [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-gray-800 [&_.recharts-reference-line_[stroke='#ccc']]:stroke-gray-600 [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

export { ChartContainer }
