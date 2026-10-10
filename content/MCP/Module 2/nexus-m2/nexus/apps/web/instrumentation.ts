/**
 * Next gọi register() 1 lần khi server khởi động → validate env ngay lúc boot,
 * không đợi request đầu tiên mới trả 500. Code dùng API Node nằm ở file riêng,
 * import sau điều kiện NEXT_RUNTIME để bundle Edge không kéo theo nó.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/boot-check.ts");
  }
}
