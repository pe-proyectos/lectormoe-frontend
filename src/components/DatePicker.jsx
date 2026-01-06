import { Popover, PopoverHandler, PopoverContent } from "./admin/ui/Popover";
import Input from "./admin/ui/Input";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import { getTranslator } from "../util/translate";

export function DatePicker({ language, value, onChange, disabled }) {
  const _ = getTranslator(language);

  return (
    <div className="p-0">
      <Popover placement="bottom">
        <PopoverHandler>
          <div>
            <Input
              label={_("select_a_date")}
              onChange={() => null}
              value={value ? format(value, "yyyy-MM-dd") : ""}
              disabled={disabled}
              readOnly
            />
          </div>
        </PopoverHandler>
        <PopoverContent>
          <DayPicker
            mode="single"
            selected={value}
            onSelect={onChange}
            showOutsideDays
            className="border-0"
            classNames={{
              caption: "flex justify-center py-2 mb-4 relative items-center",
              caption_label: "text-sm font-medium text-white",
              nav: "flex items-center",
              nav_button:
                "h-6 w-6 bg-transparent hover:bg-zinc-800 p-1 rounded-md transition-colors duration-300 text-zinc-400 hover:text-white",
              nav_button_previous: "absolute left-1.5",
              nav_button_next: "absolute right-1.5",
              table: "w-full border-collapse",
              head_row: "flex font-medium text-zinc-400",
              head_cell: "m-0.5 w-9 font-normal text-sm",
              row: "flex w-full mt-2",
              cell: "text-zinc-400 rounded-md h-9 w-9 text-center text-sm p-0 m-0.5 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-zinc-800/20 [&:has([aria-selected].day-outside)]:text-white [&:has([aria-selected])]:bg-cyan-500 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal hover:bg-zinc-800 rounded-md transition-colors",
              day_range_end: "day-range-end",
              day_selected:
                "rounded-md bg-cyan-500 text-white hover:bg-cyan-600 hover:text-white focus:bg-cyan-500 focus:text-white",
              day_today: "rounded-md bg-zinc-800 text-white font-semibold",
              day_outside:
                "day-outside text-zinc-500 opacity-50 aria-selected:bg-zinc-700 aria-selected:text-white aria-selected:bg-opacity-50",
              day_disabled: "text-zinc-600 opacity-50 cursor-not-allowed",
              day_hidden: "invisible",
            }}
            components={{
              IconLeft: ({ ...props }) => (
                <ChevronLeftIcon {...props} className="h-4 w-4 stroke-2" />
              ),
              IconRight: ({ ...props }) => (
                <ChevronRightIcon {...props} className="h-4 w-4 stroke-2" />
              ),
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
