import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.16296ea0dc1d4a41bd0d2a4219c9c30f",
  appName: "Minha Agenda",
  webDir: "dist",
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#0ea5e9",
    },
  },
};

export default config;