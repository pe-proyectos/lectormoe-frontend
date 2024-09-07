import React from "react";
import { getTranslator } from "../util/translate";
import {
    TrashIcon,
} from "@heroicons/react/24/outline";

export function DialogDatePicker({ organization, value, onChange, ...props }) {
  const _ = getTranslator(organization.language);

  const format = (date, format) => {
    const dt = new Date(date);
    const years = dt.getFullYear();
    const months = dt.getMonth() + 1;
    const days = dt.getDate();
    const hours = dt.getHours();
    const minutes = dt.getMinutes();
    return format.replace(/yyyy|MM|dd|HH|mm/g, (match) => {
      switch (match) {
        case "yyyy":
          return years;
        case "MM":
          return months < 10 ? `0${months}` : months;
        case "dd":
          return days < 10 ? `0${days}` : days;
        case "HH":
          return hours < 10 ? `0${hours}` : hours;
        case "mm":
          return minutes < 10 ? `0${minutes}` : minutes;
        default:
          return "";
      }
    });
  };

  return (
    <div className="flex gap-2 items-center">
      <input
        type="datetime-local"
        organization={organization}
        value={value ? format(value, "yyyy-MM-ddTHH:mm") : ""}
        onChange={(e) => onChange(new Date(e.target.value))}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        {...props}
      />
      <a href="#!" className="px-2 ml-1 hover:text-red-400" size="sm" onClick={() => onChange(null)}>
          <TrashIcon strokeWidth={2} className="h-5 w-5" />
      </a>
    </div>
  );
}
