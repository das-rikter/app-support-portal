"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 select-none", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "flex flex-col gap-2",
        month_caption: "flex justify-center items-center h-9 relative",
        caption_label: "text-sm font-semibold text-foreground",
        nav: "absolute inset-x-0 top-0 flex justify-between items-center",
        button_previous:
          "h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none",
        button_next:
          "h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-9 h-9 flex items-center justify-center text-[0.75rem] font-medium text-muted-foreground",
        week: "flex mt-1",
        day: "p-0",
        day_button:
          "h-9 w-9 flex items-center justify-center rounded-md text-sm text-foreground hover:bg-accent transition-colors",
        selected:
          "[&>button]:bg-[#d66a06] [&>button]:text-white [&>button]:hover:bg-[#b85505] [&>button]:font-semibold",
        today:
          "[&>button]:ring-1 [&>button]:ring-[#d66a06] [&>button]:font-semibold",
        outside: "opacity-40",
        disabled: "opacity-30 pointer-events-none",
        hidden: "invisible",
        range_start: "[&>button]:rounded-md [&>button]:bg-[#d66a06] [&>button]:text-white",
        range_end: "[&>button]:rounded-md [&>button]:bg-[#d66a06] [&>button]:text-white",
        range_middle: "[&>button]:bg-[#d66a06]/15 [&>button]:rounded-none",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeftIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"
export { Calendar }
