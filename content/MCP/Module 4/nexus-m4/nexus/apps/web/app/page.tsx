import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Nexus</h1>
      <p>
        <Link href="/chat">Mở chat</Link>
      </p>
    </main>
  );
}
