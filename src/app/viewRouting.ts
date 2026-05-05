import type { View } from "./types";

const publicViews = ["privacy", "terms", "security", "feedback", "about", "free"] as const;
const appViews = ["dashboard", "editor", "jobs", "helpers", "settings"] as const;

export const publicPathToView = (pathname: string): View => {
  const clean = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  if (clean === "") return "landing";
  if ([...publicViews, ...appViews].includes(clean as (typeof publicViews | typeof appViews)[number])) return clean as View;
  return "landing";
};

export const viewToPath = (view: View) => (view === "landing" ? "/" : `/${view}`);
