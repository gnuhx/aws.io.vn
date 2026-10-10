// A FAKE chat server — stands in for Messenger's real-time connection.
// Once connected, the friend "sends" a message every second.
let openConnections = 0;

export type Message = { id: number; from: string; text: string };

export function createConnection(friend: string) {
  let timer: ReturnType<typeof setInterval> | undefined;
  let handler: (m: Message) => void = () => {};
  let n = 0;
  return {
    connect() {
      openConnections++;
      console.log(`🔌 connect ${friend} (open: ${openConnections})`);
      timer = setInterval(() => {
        n++;
        console.log(`📩 from ${friend}: message #${n}`);
        handler({ id: Date.now() + n, from: friend, text: `message #${n}` });
      }, 1000);
    },
    disconnect() {
      clearInterval(timer);
      openConnections--;
      console.log(`❌ disconnect ${friend} (open: ${openConnections})`);
    },
    onMessage(cb: (m: Message) => void) {
      handler = cb;
    },
  };
}
