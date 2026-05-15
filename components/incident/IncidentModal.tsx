"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateIncident, useUpdateIncident } from "@/hooks/useIncidents";
import { incidentToFormValues } from "@/lib/incidentDb";
import type { IncidentForm } from "@/schemas";
import type { Incident } from "@/types/incident";
import { useState } from "react";

const inputCls =
  "w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:border-[#d66a06]";
const labelCls = "text-xs font-semibold text-muted-foreground uppercase tracking-wide";
const fieldCls = "flex flex-col gap-1";

function emptyForm(): IncidentForm {
  return {
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
    outage: "",
    resolutionDate: "",
    resolutionTime: "",
    downtime: "",
    alerted: false,
    alertSrc: "",
    cause: "",
    dasCaused: false,
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Incident | null;
}

export function IncidentModal({ open, onClose, editing }: Props) {
  const isEdit = !!editing;
  const [form, setForm] = useState<IncidentForm>(() =>
    editing ? incidentToFormValues(editing) : emptyForm()
  );
  const [error, setError] = useState<string | null>(null);

  const create = useCreateIncident();
  const update = useUpdateIncident();
  const isPending = create.isPending || update.isPending;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setForm(editing ? incidentToFormValues(editing) : emptyForm());
      setError(null);
      onClose();
    }
  };

  const set = <K extends keyof IncidentForm>(key: K, value: IncidentForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isEdit && editing?.id != null) {
        await update.mutateAsync({ id: editing.id, ...form });
      } else {
        await create.mutateAsync(form);
      }
      onClose();
      setForm(emptyForm());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

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
            <input className={inputCls} value={form.product} onChange={(e) => set("product", e.target.value)} required />
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
            <select className={inputCls} value={form.severity} onChange={(e) => set("severity", e.target.value as IncidentForm["severity"])} required>
              <option value="P1">P1 – Critical</option>
              <option value="P2">P2 – High</option>
              <option value="P3">P3 – Medium</option>
              <option value="P4">P4 – Low</option>
            </select>
          </div>

          {/* Title (full width) */}
          <div className={`${fieldCls} col-span-2`}>
            <label className={labelCls}>Title *</label>
            <input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </div>

          {/* Date + Start Time */}
          <div className={fieldCls}>
            <label className={labelCls}>Outage Start Date *</label>
            <input className={inputCls} placeholder="YYYY-MM-DD" value={form.date} onChange={(e) => set("date", e.target.value)} required />
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>Outage Start Time</label>
            <input className={inputCls} placeholder="HH:MM AM" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
          </div>

          {/* Close Date + Time */}
          <div className={fieldCls}>
            <label className={labelCls}>Close Date</label>
            <input className={inputCls} placeholder="YYYY-MM-DD" value={form.closeDate} onChange={(e) => set("closeDate", e.target.value)} />
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>Close Time</label>
            <input className={inputCls} placeholder="HH:MM AM" value={form.closeTime} onChange={(e) => set("closeTime", e.target.value)} />
          </div>

          {/* Outage + Resolution Date */}
          <div className={fieldCls}>
            <label className={labelCls}>Outage Duration (H:MM)</label>
            <input className={inputCls} placeholder="H:MM" value={form.outage} onChange={(e) => set("outage", e.target.value)} />
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>Resolution Date</label>
            <input className={inputCls} placeholder="YYYY-MM-DD" value={form.resolutionDate} onChange={(e) => set("resolutionDate", e.target.value)} />
          </div>

          {/* Resolution Time + Downtime */}
          <div className={fieldCls}>
            <label className={labelCls}>Resolution Time</label>
            <input className={inputCls} placeholder="HH:MM AM" value={form.resolutionTime} onChange={(e) => set("resolutionTime", e.target.value)} />
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>Downtime (H:MM)</label>
            <input className={inputCls} placeholder="H:MM" value={form.downtime} onChange={(e) => set("downtime", e.target.value)} />
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
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <input type="checkbox" checked={form.alerted} onChange={(e) => set("alerted", e.target.checked)} className="h-4 w-4 rounded accent-[#d66a06]" />
              Alerted
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
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
