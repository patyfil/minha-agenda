import { useEffect, useMemo, useRef, useState } from "react";
import { format, isToday, isTomorrow, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Share2, Calendar as CalIcon, Settings2, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EventDialog, EventDraft } from "@/components/EventDialog";
import {
  cancelNotification,
  ensurePermission,
  scheduleEventNotification,
} from "@/lib/notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LocalEvent,
  loadEvents,
  upsertEvent,
  deleteEvent as removeEvent,
  newId,
  exportJson,
  importJson,
} from "@/lib/storage";

function groupLabel(d: Date): string {
  if (isToday(d)) return "Hoje";
  if (isTomorrow(d)) return "Amanhã";
  return "Mais tarde";
}

export default function Index() {
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LocalEvent | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ensurePermission();
    setEvents(loadEvents());
  }, []);

  const grouped = useMemo(() => {
    const cutoff = startOfDay(new Date());
    const visible = [...events]
      .filter((e) => new Date(e.starts_at) >= cutoff || isToday(new Date(e.starts_at)))
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    const groups: Record<string, LocalEvent[]> = { Hoje: [], Amanhã: [], "Mais tarde": [] };
    for (const ev of visible) groups[groupLabel(new Date(ev.starts_at))].push(ev);
    return groups;
  }, [events]);

  async function handleSave(draft: EventDraft) {
    if (editing?.notification_id) await cancelNotification(editing.notification_id);

    let notificationId: number | null = null;
    if (draft.notify_minutes_before >= 0) {
      const id = Math.floor(Math.random() * 2_000_000_000);
      const scheduled = await scheduleEventNotification({
        id,
        title: draft.title,
        startsAt: new Date(draft.starts_at),
        minutesBefore: draft.notify_minutes_before,
      });
      if (scheduled) notificationId = id;
    }

    const ev: LocalEvent = {
      id: draft.id ?? newId(),
      title: draft.title,
      starts_at: draft.starts_at,
      ends_at: draft.ends_at,
      notify_minutes_before: draft.notify_minutes_before,
      notification_id: notificationId,
    };
    const list = upsertEvent(ev);
    setEvents(list);
    toast.success(draft.id ? "Compromisso atualizado" : "Compromisso adicionado");
    setEditing(null);
  }

  async function handleDelete() {
    if (!editing) return;
    if (editing.notification_id) await cancelNotification(editing.notification_id);
    setEvents(removeEvent(editing.id));
    toast.success("Compromisso excluído");
    setDialogOpen(false);
    setEditing(null);
  }

  function buildShareText() {
    if (!events.length) return "Minha agenda está vazia.";
    const lines = ["📅 Minha Agenda", ""];
    const sorted = [...events].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    for (const ev of sorted) {
      const d = new Date(ev.starts_at);
      lines.push(`• ${format(d, "dd/MM/yyyy", { locale: ptBR })} às ${format(d, "HH:mm")} — ${ev.title}`);
    }
    return lines.join("\n");
  }

  async function shareNative() {
    const text = buildShareText();
    try {
      const { Capacitor } = await import("@capacitor/core");
      if (Capacitor.isNativePlatform()) {
        const { Share } = await import("@capacitor/share");
        await Share.share({ title: "Minha Agenda", text });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: "Minha Agenda", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success("Agenda copiada");
    } catch { /* cancelled */ }
  }

  function shareWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(buildShareText())}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function shareEmail() {
    const url = `mailto:?subject=${encodeURIComponent("Minha Agenda")}&body=${encodeURIComponent(buildShareText())}`;
    window.location.href = url;
  }

  // ---- BACKUP ----
  async function backup() {
    const json = exportJson();
    const filename = `agenda-backup-${format(new Date(), "yyyy-MM-dd-HHmm")}.json`;
    try {
      const { Capacitor } = await import("@capacitor/core");
      if (Capacitor.isNativePlatform()) {
        const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
        const res = await Filesystem.writeFile({
          path: filename,
          data: json,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
          recursive: true,
        });
        try {
          const { Share } = await import("@capacitor/share");
          await Share.share({
            title: "Backup da Agenda",
            text: "Backup da Minha Agenda",
            url: res.uri,
            dialogTitle: "Salvar backup (Google Drive, Email, etc.)",
          });
        } catch {
          toast.success(`Backup salvo em Documentos: ${filename}`);
        }
        return;
      }
    } catch (e) {
      console.error(e);
    }
    // Web fallback: download
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup baixado");
  }

  function triggerRestore() {
    fileInputRef.current?.click();
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await file.text();
    const result = importJson(text);
    if (!result.ok) {
      toast.error(result.error || "Falha ao restaurar");
      return;
    }
    setEvents(loadEvents());
    toast.success(`Restaurado! ${result.count} compromissos.`);
  }

  return (
    <main className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalIcon className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Minha Agenda</h1>
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Compartilhar">
                  <Share2 className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={shareWhatsApp}>WhatsApp</DropdownMenuItem>
                <DropdownMenuItem onClick={shareEmail}>Email</DropdownMenuItem>
                <DropdownMenuItem onClick={shareNative}>Outros…</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Backup">
                  <Settings2 className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={backup}>
                  <Download className="h-4 w-4 mr-2" /> Fazer backup
                </DropdownMenuItem>
                <DropdownMenuItem onClick={triggerRestore}>
                  <Upload className="h-4 w-4 mr-2" /> Restaurar backup
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs text-muted-foreground max-w-[220px]">
                  O backup é um arquivo .json que você pode salvar no Google Drive, e-mail ou no próprio celular.
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onFileSelected}
      />

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-10">
        {(["Hoje", "Amanhã", "Mais tarde"] as const).map((label) => (
          <section key={label}>
            <div className="mb-3">
              <h2 className="text-2xl font-bold">{label}</h2>
              <p className="text-sm text-muted-foreground">
                {label === "Hoje" && format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                {label === "Amanhã" && format(new Date(Date.now() + 86400000), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
            </div>

            {grouped[label].length === 0 ? (
              <button
                onClick={() => { setEditing(null); setDialogOpen(true); }}
                className="w-full text-left text-muted-foreground py-3 text-base hover:text-foreground transition-colors"
              >
                + Adicionar uma nova tarefa
              </button>
            ) : (
              <ul className="space-y-3">
                {grouped[label].map((ev) => {
                  const d = new Date(ev.starts_at);
                  const end = ev.ends_at ? new Date(ev.ends_at) : null;
                  return (
                    <li key={ev.id}>
                      <button
                        onClick={() => { setEditing(ev); setDialogOpen(true); }}
                        className="w-full text-left flex items-start gap-3 py-2 group"
                      >
                        <span className="mt-1.5 h-5 w-5 rounded-full border-2 border-muted-foreground/40 group-hover:border-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-base leading-snug break-words">{ev.title}</p>
                          <p className="text-sm text-muted-foreground mt-0.5 break-words">
                            {format(d, "dd/MM/yyyy", { locale: ptBR })}, {format(d, "HH:mm")}
                            {end && ` - ${format(end, "HH:mm")}`}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>

      <Button
        size="icon"
        onClick={() => { setEditing(null); setDialogOpen(true); }}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-2xl shadow-[var(--shadow-fab)]"
        aria-label="Novo compromisso"
      >
        <Plus className="h-7 w-7" />
      </Button>

      <EventDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
        initial={editing ? {
          id: editing.id,
          title: editing.title,
          starts_at: editing.starts_at,
          ends_at: editing.ends_at,
          notify_minutes_before: editing.notify_minutes_before,
        } : null}
        onSave={async (d) => { await handleSave(d); }}
        onDelete={editing ? async () => { await handleDelete(); } : undefined}
      />
    </main>
  );
}
