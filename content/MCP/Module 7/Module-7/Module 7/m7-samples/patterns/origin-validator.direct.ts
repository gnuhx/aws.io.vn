// "Dịch thẳng từ C#" — S7.3: lớp validator + regex/Contains, đăng ký như service. ĐỪNG viết thế này.
export interface IOriginValidator {
  isAllowed(origin: string | undefined, host: string | undefined): boolean;
}

export class RegexOriginValidator implements IOriginValidator {
  private readonly pattern: RegExp;
  constructor(pattern: RegExp = /localhost|127\.0\.0\.1/) {
    this.pattern = pattern;
  }
  isAllowed(origin: string | undefined, host: string | undefined): boolean {
    if (!origin) return true; // không Origin → cho qua (đúng)…
    return this.pattern.test(origin) && (host ?? "").length > 0; // …nhưng regex không neo, không so Host thật
  }
}
