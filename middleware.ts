import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Must match unprefixed pathnames when localePrefix is "as-needed" (default es)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
