import type { ReactNode } from "react";

export const metadata = { title: "Nexus", description: "Chat với dữ liệu công ty" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>{children}</body>
    </html>
  );
}
