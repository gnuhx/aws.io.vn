
export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div role="alert">
      <p>Không tải được dashboard. Mã lỗi: {error.digest ?? "—"}</p>
      <p className="err">{error.message}</p>
      <button type="button" onClick={() => retry()}>Thử lại</button>
    </div>
  );
}
