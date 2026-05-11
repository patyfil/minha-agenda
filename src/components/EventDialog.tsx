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

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
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
    const starts = new Date(`${date}T${time}`);
    if (isNaN(starts.getTime())) {
      toast.error("Data/hora inválida");
      return;
    }
    let ends: Date | null = null;
    if (endTime) {
      ends = new Date(`${date}T${endTime}`);
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
              <Input id="d" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="h">Hora</Label>
              <Input id="h" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="he">Hora de término (opcional)</Label>
            <Input id="he" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
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