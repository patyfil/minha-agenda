import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { toast } from "sonner";

export type EventDraft = {
  id?: string;
  title: string;
  starts_at: string; // ISO
  ends_at: string | null;
  notify_minutes_before: number;
};

const REMINDERS = [
  { value: -1, label: "Sem notificação" },
  { value: 0, label: "No horário" },
  { value: 10, label: "10 minutos antes" },
  { value: 30, label: "30 minutos antes" },
  { value: 60, label: "1 hora antes" },
  { value: 1440, label: "1 dia antes" },
];

const schema = z.object({
  title: z.string().trim().min(1, "Informe o título").max(120),
  date: z.string().min(1, "Informe a data"),
  time: z.string().min(1, "Informe a hora"),
});

const pad = (n: number) => String(n).padStart(2, "0");

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function formatTimeInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function parseTime(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

function parseLocalDateTime(dateText: string, timeText: string) {
  const dateMatch = dateText.match(/^(\d{2})\/(\d{2})\/(\d{4})$/) ?? dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const time = parseTime(timeText);
  if (!dateMatch || !time) return null;

  const isIso = dateText.includes("-");
  const year = Number(dateMatch[isIso ? 1 : 3]);
  const month = Number(dateMatch[isIso ? 2 : 2]);
  const day = Number(dateMatch[isIso ? 3 : 1]);
  const date = new Date(year, month - 1, day, time.hours, time.minutes, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  return {
    date: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: EventDraft | null;
  onSave: (draft: EventDraft) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
};

export function EventDialog({ open, onOpenChange, initial, onSave, onDelete }: Props) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reminder, setReminder] = useState<number>(10);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      const s = toLocalInput(initial.starts_at);
      setTitle(initial.title);
      setDate(s.date);
      setTime(s.time);
      setEndTime(initial.ends_at ? toLocalInput(initial.ends_at).time : "");
      setReminder(initial.notify_minutes_before ?? 10);
    } else {
      const now = new Date();
      now.setMinutes(0, 0, 0);
      now.setHours(now.getHours() + 1);
      const s = toLocalInput(now.toISOString());
      setTitle("");
      setDate(s.date);
      setTime(s.time);
      setEndTime("");
      setReminder(10);
    }
  }, [open, initial]);

  const save = async () => {
    const parsed = schema.safeParse({ title, date, time });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const starts = parseLocalDateTime(date, time);
    if (!starts) {
      toast.error("Data/hora inválida");
      return;
    }
    let ends: Date | null = null;
    if (endTime) {
      ends = parseLocalDateTime(date, endTime);
      if (!ends) {
        toast.error("Hora de término inválida");
        return;
      }
      if (ends <= starts) ends.setDate(ends.getDate() + 1);
    }
    setBusy(true);
    try {
      await onSave({
        id: initial?.id,
        title: title.trim(),
        starts_at: starts.toISOString(),
        ends_at: ends ? ends.toISOString() : null,
        notify_minutes_before: reminder,
      });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar compromisso" : "Novo compromisso"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="t">Título</Label>
            <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Consulta médica" maxLength={120} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="d">Data</Label>
              <Input
                id="d"
                type="text"
                inputMode="numeric"
                value={date}
                onChange={(e) => setDate(formatDateInput(e.target.value))}
                placeholder="dd/mm/aaaa"
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="h">Hora</Label>
              <Input
                id="h"
                type="text"
                inputMode="numeric"
                value={time}
                onChange={(e) => setTime(formatTimeInput(e.target.value))}
                placeholder="hh:mm"
                maxLength={5}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="he">Hora de término (opcional)</Label>
            <Input
              id="he"
              type="text"
              inputMode="numeric"
              value={endTime}
              onChange={(e) => setEndTime(formatTimeInput(e.target.value))}
              placeholder="hh:mm"
              maxLength={5}
            />
          </div>
          <div className="space-y-2">
            <Label>Notificação</Label>
            <Select value={String(reminder)} onValueChange={(v) => setReminder(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REMINDERS.map((r) => (
                  <SelectItem key={r.value} value={String(r.value)}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          {initial && onDelete && (
            <Button type="button" variant="destructive" onClick={onDelete} disabled={busy} className="mr-auto">
              Excluir
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button type="button" onClick={save} disabled={busy}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}