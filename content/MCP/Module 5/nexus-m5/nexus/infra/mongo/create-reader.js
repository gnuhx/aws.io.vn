// mongosh "mongodb://admin:<mật khẩu>@127.0.0.1:27017/admin?replicaSet=rs0" infra/mongo/create-reader.js
// User riêng cho tool nexus_query: chỉ role "read" trên db nexus (M5 · S5.2).
// Chưa chạy ở sandbox dựng bài (không có MongoDB).
const pwd = process.env.NEXUS_READER_PASSWORD;
if (!pwd) throw new Error("đặt NEXUS_READER_PASSWORD trước khi chạy");
const admin = db.getSiblingDB("admin");
if (admin.getUser("nexus_reader")) {
  admin.updateUser("nexus_reader", { pwd, roles: [{ role: "read", db: "nexus" }] });
} else {
  admin.createUser({ user: "nexus_reader", pwd, roles: [{ role: "read", db: "nexus" }] });
}
printjson(admin.getUser("nexus_reader", { showPrivileges: false }));
