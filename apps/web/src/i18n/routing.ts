import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ko", "en", "ja", "zh", "es", "hi"],
  defaultLocale: "ko",
  localePrefix: "as-needed",
});
