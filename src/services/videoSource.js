export function isVimeoPlayer(url) {
  try { const parsed = new URL(url); return parsed.protocol === "https:" && parsed.hostname === "player.vimeo.com" && /^\/video\/\d+$/.test(parsed.pathname); } catch { return false; }
}
