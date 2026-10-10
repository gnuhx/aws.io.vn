import type { City, Customer, EnrichSuggestion, Industry } from "@nexus/shared";
import { fold } from "../text.ts"; // "Ba Đình, HN" → "ba dinh, hn": so bằng regex ASCII, không lo dấu

const CITY: [City, RegExp][] = [
  ["Hà Nội", /\b(ha noi|hn|ba dinh|hoan kiem|thanh xuan|cau giay|tay ho|long bien|hai ba trung)\b/],
  ["TP.HCM", /\b(tp\.? ?hcm|ho chi minh|sai gon|q\.? ?\d{1,2}|quan \d{1,2})\b/],
  ["Đà Nẵng", /\b(da nang|dn|son tra|hai chau|ngu hanh son)\b/],
  ["Hải Phòng", /\b(hai phong|ngo quyen|le chan|do son)\b/],
  ["Cần Thơ", /\b(can tho|ninh kieu|cai rang)\b/],
];
const INDUSTRY: [Industry, RegExp][] = [
  ["cafe", /\b(ca phe|coffee|cafe)\b/],
  ["education", /\b(day|dao tao|anh ngu|truong|hoc)\b/],
  ["logistics", /\b(van tai|giao hang|kho|logistics)\b/],
  ["retail", /\b(ban le|tap hoa|cua hang|sieu thi)\b/],
  ["software", /\b(phan mem|app|software)\b/],
  ["manufacturing", /\b(xuong|san xuat)\b/],
];

/** Đúng 1 luật khớp mới tin; 0 hoặc ≥ 2 → null ("không chắc"), không đoán. */
function only<T>(rules: [T, RegExp][], text: string): T | null {
  const hits = rules.filter(([, re]) => re.test(text)).map(([v]) => v);
  return hits.length === 1 ? (hits[0] ?? null) : null;
}

export function rulesSuggest(c: Customer): EnrichSuggestion {
  return {
    city: c.city ?? only(CITY, fold(c.address)),
    industry: c.industry ?? only(INDUSTRY, fold(`${c.name} ${c.note}`)),
  };
}
