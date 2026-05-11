import { Capacitor } from "@capacitor/core";

let LocalNotifications: typeof import("@capacitor/local-notifications").LocalNotifications | null = null;

async function getLN() {
  if (!Capacitor.isNativePlatform()) return null;
  if (!LocalNotifications) {
    const mod = await import("@capacitor/local-notifications");
    LocalNotifications = mod.LocalNotifications;
  }
  return LocalNotifications;
}

export async function ensurePermission() {
  const LN = await getLN();
  if (!LN) return false;
  const perm = await LN.checkPermissions();
  if (perm.display !== "granted") {
    const req = await LN.requestPermissions();
    return req.display === "granted";
  }
  return true;
}

export async function scheduleEventNotification(opts: {
  id: number;
  title: string;
  startsAt: Date;
  minutesBefore: number;
}) {
  const LN = await getLN();
  if (!LN) return null;
  const at = new Date(opts.startsAt.getTime() - opts.minutesBefore * 60_000);
  if (at.getTime() <= Date.now()) return null;
  await LN.schedule({
    notifications: [
      {
        id: opts.id,
        title: "Compromisso",
        body: opts.title,
        schedule: { at },
        smallIcon: "ic_stat_icon_config_sample",
      },
    ],
  });
  return opts.id;
}

export async function cancelNotification(id: number | null | undefined) {
  if (!id) return;
  const LN = await getLN();
  if (!LN) return;
  try {
    await LN.cancel({ notifications: [{ id }] });
  } catch {}
}