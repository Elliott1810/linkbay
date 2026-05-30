// In-memory ring buffer for recent IP connections (last 100)
// Resets on server restart. Used by /admin Recent Connections panel.

export interface IpLogEntry {
  ip: string;
  path: string;
  userAgent: string;
  timestamp: string;
  userEmail?: string | null;
}

const MAX_ENTRIES = 100;
export const ipLogBuffer: IpLogEntry[] = [];

export function pushIpLog(entry: IpLogEntry) {
  ipLogBuffer.unshift(entry);
  if (ipLogBuffer.length > MAX_ENTRIES) {
    ipLogBuffer.length = MAX_ENTRIES;
  }
}

// Simple in-memory geolocation cache (avoids hammering ipapi.co)
const geoCache = new Map<string, string>();

export async function geolocateIp(ip: string): Promise<string> {
  if (!ip || ip === "::1" || ip === "127.0.0.1" || ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.")) {
    return "Local";
  }
  if (geoCache.has(ip)) return geoCache.get(ip)!;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const r = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, { signal: controller.signal });
    clearTimeout(timer);
    if (!r.ok) {
      geoCache.set(ip, "—");
      return "—";
    }
    const j: any = await r.json();
    const loc = [j.city, j.region, j.country_name].filter(Boolean).join(", ") || "—";
    geoCache.set(ip, loc);
    return loc;
  } catch {
    geoCache.set(ip, "—");
    return "—";
  }
}
