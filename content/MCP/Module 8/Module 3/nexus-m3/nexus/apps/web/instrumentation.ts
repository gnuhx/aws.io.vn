/** Next gọi register() lúc khởi động — validate env ở đây để sai cấu hình là chết ngay lúc boot. */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/boot-check.ts");
  }
}
