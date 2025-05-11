import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"
import { ChartContext, type ChartConfig } from "./chart/chart-context" // Import context and ChartConfig
import ChartStyle from "./chart/ChartStyle" // Import ChartStyle
import ChartTooltipContent from "./chart/ChartTooltipContent" // Import ChartTooltipContent
import ChartLegendContent from "./chart/ChartLegendContent" // Import ChartLegendContent
// getPayloadConfigFromPayload is now in chart-utils.ts and used by Tooltip/Legend content components directly.
// THEMES is in chart-context.ts and used by ChartStyle directly.

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig // Use ChartConfig from context file
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
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

// ChartStyle is now imported

const ChartTooltip = RechartsPrimitive.Tooltip

// ChartTooltipContent is now imported

const ChartLegend = RechartsPrimitive.Legend

// ChartLegendContent is now imported

// getPayloadConfigFromPayload helper function is now in chart-utils.ts

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent, // Re-export imported component
  ChartLegend,
  ChartLegendContent, // Re-export imported component
  ChartStyle, // Re-export imported component
  type ChartConfig, // Re-export ChartConfig type
}
