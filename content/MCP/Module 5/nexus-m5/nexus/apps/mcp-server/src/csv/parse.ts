/**
 * CSV theo RFC 4180: dấu phẩy, ngoặc kép bao ô, "" là 1 dấu ngoặc, xuống dòng trong ô có ngoặc (M5 · S5.4).
 * Không dùng split(","): "Cà phê, trà" là 1 ô, không phải 2.
 */
export interface Csv {
  header: string[];
  rows: string[][];
}

export function parseCsv(text: string): Csv {
  const out: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // bỏ BOM của Excel
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"' && cell === "") quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      out.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    out.push(row);
  }
  const [header = [], ...rows] = out.filter((r) => !(r.length === 1 && r[0] === ""));
  return { header: header.map((h) => h.trim()), rows };
}

/** "1.250.000", "1,250,000.5", " 42 " → số; không phải số → undefined. */
export function parseNumber(raw: string): number | undefined {
  const s = raw.trim().replace(/\s/g, "");
  if (s === "") return undefined;
  const normalized = /^\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, "") : s.replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
}
