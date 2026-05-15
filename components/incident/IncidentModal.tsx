"use client";

import { format, isValid, parse } from "date-fns";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCreateIncident, useUpdateIncident } from "@/hooks/useIncidents";
import { incidentToFormValues, localDateTimeToUTC } from "@/lib/incidentDb";
import { IncidentFormSchema, type IncidentForm } from "@/schemas";
import type { Incident } from "@/types/incident";

const inputCls =
  "w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:border-[#d66a06]" as const;
const inputErrCls =
  "w-full border border-destructive rounded-lg px-3 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:border-destructive" as const;
const labelCls = "text-xs font-semibold text-muted-foreground uppercase tracking-wide" as const;
const fieldCls = "flex flex-col gap-1" as const;
const errMsgCls = "text-xs text-destructive" as const;

const emptyForm = (): IncidentForm => ({
  product: "",
  function: "",
  owner: "",
  lead: "",
  severity: "P3",
  title: "",
  date: "",
  startTime: "",
  closeDate: "",
  closeTime: "",
  resolutionDate: "",
  resolutionTime: "",
  downtime: "",
  alerted: false,
  alertSrc: "",
  cause: "",
  dasCaused: false,
});

const dateToCalendar = (val: string): Date | undefined => {
  if (!val) return undefined;
  const d = parse(val, "yyyy-MM-dd", new Date());
  return isValid(d) ? d : undefined;
}

const calendarToDate = (d: Date): string => format(d, "yyyy-MM-dd");

interface DatePickerProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hasError?: boolean;
}

const DatePickerField = ({ value, onChange, placeholder = "Pick a date", hasError }: DatePickerProps) => {
  const [open, setOpen] = useState(false);
  const selected = dateToCalendar(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`${hasError ? inputErrCls : inputCls} flex items-center justify-between cursor-pointer`}
        >
          <span className={selected ? "text-foreground" : "text-muted-foreground"}>
            {selected ? format(selected, "MMM d, yyyy") : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            onChange(d ? calendarToDate(d) : "");
            setOpen(false);
          }}
        />
        {value && (
          <div className="border-t px-3 py-2">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => { onChange(""); setOpen(false); }}
            >
              Clear date
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as const;

function parseTimeValue(val: string): { h: number; m: number; ampm: "AM" | "PM" } | null {
  if (!val) return null;
  const match = val.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return null;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const period = match[3]?.toUpperCase() as "AM" | "PM" | undefined;
  if (period) return { h: h === 0 ? 12 : h, m, ampm: period };
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return { h, m, ampm };
}

function filterTimeHMS(val: string): string {
  const cleaned = val.replace(/[^\d:]/g, "");
  const [h = "", mm = "", ss] = cleaned.split(":");
  if (ss !== undefined) return `${h}:${mm.slice(0, 2)}:${ss.slice(0, 2)}`;
  if (cleaned.includes(":")) return `${h}:${mm.slice(0, 2)}`;
  return h;
}

function filterDuration(val: string): string {
  const cleaned = val.replace(/[^\d:]/g, "");
  const colonIdx = cleaned.indexOf(":");
  if (colonIdx === -1) return cleaned;
  const before = cleaned.slice(0, colonIdx);
  const after = cleaned.slice(colonIdx + 1).replace(/:/g, "").slice(0, 2);
  return `${before}:${after}`;
}

function snapMinute(m: number): number {
  return Math.round(m / 5) * 5 % 60;
}

interface TimePickerProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hasError?: boolean;
}

function TimePickerField({ value, onChange, placeholder = "Pick a time", hasError }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const parsed = parseTimeValue(value);
  const [h, setH] = useState<number>(parsed?.h ?? 9);
  const [m, setM] = useState<number>(parsed ? snapMinute(parsed.m) : 0);
  const [ampm, setAmpm] = useState<"AM" | "PM">(parsed?.ampm ?? "AM");

  const handleOpenChange = (next: boolean) => {
    if (next) {
      const p = parseTimeValue(value);
      if (p) { setH(p.h); setM(snapMinute(p.m)); setAmpm(p.ampm); }
      else { setH(9); setM(0); setAmpm("AM"); }
    }
    setOpen(next);
  };

  const display = parsed
    ? `${parsed.h}:${String(parsed.m).padStart(2, "0")} ${parsed.ampm}`
    : null;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            hasError ? inputErrCls : inputCls,
            "flex items-center justify-between cursor-pointer"
          )}
        >
          <span className={display ? "text-foreground" : "text-muted-foreground"}>
            {display ?? placeholder}
          </span>
          <ClockIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <div className="mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Hour</p>
          <div className="grid grid-cols-6 gap-1">
            {HOURS.map((hour) => (
              <button
                key={hour}
                type="button"
                onClick={() => setH(hour)}
                className={cn(
                  "h-8 rounded-md text-sm font-medium transition-colors",
                  h === hour
                    ? "bg-[#d66a06] text-white"
                    : "hover:bg-accent text-foreground"
                )}
              >
                {hour}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Minute</p>
          <div className="grid grid-cols-6 gap-1">
            {MINUTES.map((min) => (
              <button
                key={min}
                type="button"
                onClick={() => setM(min)}
                className={cn(
                  "h-8 rounded-md text-sm font-medium transition-colors",
                  m === min
                    ? "bg-[#d66a06] text-white"
                    : "hover:bg-accent text-foreground"
                )}
              >
                {String(min).padStart(2, "0")}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Period</p>
          <div className="flex gap-2">
            {(["AM", "PM"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setAmpm(p)}
                className={cn(
                  "flex-1 h-8 rounded-md text-sm font-semibold transition-colors",
                  ampm === p
                    ? "bg-[#d66a06] text-white"
                    : "border border-border hover:bg-accent text-foreground"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          {value && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => { onChange(""); setOpen(false); }}
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onChange(`${h}:${String(m).padStart(2, "0")} ${ampm}`);
              setOpen(false);
            }}
            className="ml-auto px-3 py-1 rounded-md bg-[#d66a06] text-white text-xs font-semibold hover:bg-[#b85505] transition-colors"
          >
            Set Time
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Incident | null;
}

type FieldErrors = Partial<Record<keyof IncidentForm, string>>;

export const IncidentModal = ({ open, onClose, editing }: Props) => {
  const isEdit = !!editing;
  const [prevEditing, setPrevEditing] = useState(editing);
  const [form, setForm] = useState<IncidentForm>(() =>
    editing ? incidentToFormValues(editing) : emptyForm()
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  if (prevEditing !== editing) {
    setPrevEditing(editing);
    setForm(editing ? incidentToFormValues(editing) : emptyForm());
    setError(null);
    setFieldErrors({});
  }

  const create = useCreateIncident();
  const update = useUpdateIncident();
  const isPending = create.isPending || update.isPending;

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setForm(editing ? incidentToFormValues(editing) : emptyForm());
      setError(null);
      setFieldErrors({});
      onClose();
    }
  };

  const set = <K extends keyof IncidentForm>(key: K, value: IncidentForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((fe) => { const next = { ...fe }; delete next[key]; return next; });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const result = IncidentFormSchema.safeParse(form);
    if (!result.success) {
      const errs: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof IncidentForm;
        if (key && !errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    const data = { ...result.data };
    const startUTC = localDateTimeToUTC(data.date, data.startTime);
    if (startUTC) { data.date = startUTC.date; data.startTime = startUTC.time; }
    const closeUTC = localDateTimeToUTC(data.closeDate, data.closeTime);
    if (closeUTC) { data.closeDate = closeUTC.date; data.closeTime = closeUTC.time; }
    const resolutionUTC = localDateTimeToUTC(data.resolutionDate, data.resolutionTime);
    if (resolutionUTC) { data.resolutionDate = resolutionUTC.date; data.resolutionTime = resolutionUTC.time; }

    try {
      if (isEdit && editing?.id != null) {
        await update.mutateAsync({ id: editing.id, ...data });
      } else {
        await create.mutateAsync(data);
      }
      onClose();
      setForm(emptyForm());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const fe = fieldErrors;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Incident" : "Add Incident"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mt-2">
          {/* Product + Function */}
          <div className={fieldCls}>
            <label className={labelCls}>Product *</label>
            <input className={fe.product ? inputErrCls : inputCls} value={form.product} onChange={(e) => set("product", e.target.value)} />
            {fe.product && <span className={errMsgCls}>{fe.product}</span>}
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>Function / Area</label>
            <input className={inputCls} value={form.function} onChange={(e) => set("function", e.target.value)} />
          </div>

          {/* Owner + Lead */}
          <div className={fieldCls}>
            <label className={labelCls}>Owner</label>
            <input className={inputCls} value={form.owner} onChange={(e) => set("owner", e.target.value)} />
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>Lead</label>
            <input className={inputCls} value={form.lead} onChange={(e) => set("lead", e.target.value)} />
          </div>

          {/* Severity */}
          <div className={fieldCls}>
            <label className={labelCls}>Severity *</label>
            <select className={inputCls} value={form.severity} onChange={(e) => set("severity", e.target.value as IncidentForm["severity"])}>
              <option value="P1">P1 - Critical</option>
              <option value="P2">P2 - High</option>
              <option value="P3">P3 - Medium</option>
              <option value="P4">P4 - Low</option>
            </select>
          </div>

          {/* Title (full width) */}
          <div className={`${fieldCls} col-span-2`}>
            <label className={labelCls}>Title *</label>
            <input className={fe.title ? inputErrCls : inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} />
            {fe.title && <span className={errMsgCls}>{fe.title}</span>}
          </div>

          {/* Outage Start Date + Start Time */}
          <div className={fieldCls}>
            <label className={labelCls}>Outage Start Date *</label>
            <DatePickerField value={form.date} onChange={(v) => set("date", v)} placeholder="Pick start date" hasError={!!fe.date} />
            {fe.date && <span className={errMsgCls}>{fe.date}</span>}
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>Outage Start Time</label>
            <TimePickerField value={form.startTime} onChange={(v) => set("startTime", v)} placeholder="Pick start time" hasError={!!fe.startTime} />
            {fe.startTime && <span className={errMsgCls}>{fe.startTime}</span>}
          </div>

          {/* Close Date + Time */}
          <div className={fieldCls}>
            <label className={labelCls}>Close Date</label>
            <DatePickerField value={form.closeDate} onChange={(v) => set("closeDate", v)} placeholder="Pick close date" hasError={!!fe.closeDate} />
            {fe.closeDate && <span className={errMsgCls}>{fe.closeDate}</span>}
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>Close Time</label>
            <TimePickerField value={form.closeTime} onChange={(v) => set("closeTime", v)} placeholder="Pick close time" hasError={!!fe.closeTime} />
            {fe.closeTime && <span className={errMsgCls}>{fe.closeTime}</span>}
          </div>

          {/* Resolution Date */}
          <div className={fieldCls}>
            <label className={labelCls}>Resolution Date</label>
            <DatePickerField value={form.resolutionDate} onChange={(v) => set("resolutionDate", v)} placeholder="Pick resolution date" hasError={!!fe.resolutionDate} />
            {fe.resolutionDate && <span className={errMsgCls}>{fe.resolutionDate}</span>}
          </div>

          {/* Resolution Time + Downtime */}
          <div className={fieldCls}>
            <label className={labelCls}>Resolution Time</label>
            <input className={fe.resolutionTime ? inputErrCls : inputCls} placeholder="HH:MM:SS" value={form.resolutionTime} onChange={(e) => set("resolutionTime", filterTimeHMS(e.target.value))} />
            {fe.resolutionTime && <span className={errMsgCls}>{fe.resolutionTime}</span>}
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>Downtime (HH:MM)</label>
            <input className={fe.downtime ? inputErrCls : inputCls} placeholder="HH:MM" value={form.downtime} onChange={(e) => set("downtime", filterDuration(e.target.value))} />
            {fe.downtime && <span className={errMsgCls}>{fe.downtime}</span>}
          </div>

          {/* Cause (full width) */}
          <div className={`${fieldCls} col-span-2`}>
            <label className={labelCls}>Cause</label>
            <input className={inputCls} value={form.cause} onChange={(e) => set("cause", e.target.value)} />
          </div>

          {/* Alert Source */}
          <div className={`${fieldCls} col-span-2`}>
            <label className={labelCls}>Alert Source</label>
            <input className={inputCls} value={form.alertSrc} onChange={(e) => set("alertSrc", e.target.value)} />
          </div>

          {/* Checkboxes */}
          <div className="col-span-2 flex flex-wrap gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium select-none">
              <input type="checkbox" checked={form.alerted} onChange={(e) => set("alerted", e.target.checked)} className="h-4 w-4 rounded accent-[#d66a06]" />
              Alerted
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium select-none">
              <input type="checkbox" checked={form.dasCaused} onChange={(e) => set("dasCaused", e.target.checked)} className="h-4 w-4 rounded accent-[#d66a06]" />
              DAS Caused (Internal)
            </label>
          </div>

          {error && (
            <div className="col-span-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="col-span-2 flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-[#d66a06] text-white text-sm font-semibold hover:bg-[#b85505] transition-colors disabled:opacity-50"
            >
              {isPending ? (isEdit ? "Saving…" : "Adding…") : isEdit ? "Save Changes" : "Add Incident"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
