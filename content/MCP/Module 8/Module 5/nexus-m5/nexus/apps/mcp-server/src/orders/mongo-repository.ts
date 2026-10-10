import type { Order } from "@nexus/shared";
import type { Db, Document } from "mongodb";
import type { Dimension, MonthRange, OrderFilter, OrderRepository, RevenueRow } from "./repository.ts";

type OrderDoc = Omit<Order, "id"> & { _id: string };

const TZ = "Asia/Ho_Chi_Minh";
/** Tháng theo giờ VN, tính trong DB. createdAt lưu chuỗi ISO → đổi sang Date trước. */
const MONTH_EXPR = { $dateToString: { format: "%Y-%m", date: { $dateFromString: { dateString: "$createdAt" } }, timezone: TZ } };

function monthMatch(r: MonthRange): Document[] {
  if (r.from === undefined && r.to === undefined) return [];
  return [
    { $addFields: { _month: MONTH_EXPR } },
    { $match: { _month: { ...(r.from ? { $gte: r.from } : {}), ...(r.to ? { $lte: r.to } : {}) } } },
  ];
}

/** Bản Mongo — chưa chạy ở sandbox dựng bài (không có Mongo). Index gợi ý: { status: 1, createdAt: 1 }. */
export function createMongoOrderRepository(db: Db): OrderRepository {
  const col = db.collection<OrderDoc>("orders");
  return {
    async all() {
      const docs = await col.find({}).sort({ createdAt: 1 }).toArray();
      return docs.map(({ _id, ...rest }) => ({ id: _id, ...rest }));
    },
    async revenueBy(by: Dimension, range: MonthRange) {
      const key = by === "month" ? MONTH_EXPR : by === "city" ? "$city" : "$product";
      const pipeline: Document[] = [
        { $match: { status: "paid" } }, // $match sớm để dùng index
        ...monthMatch(range),
        { $group: { _id: key, orders: { $sum: 1 }, revenue: { $sum: "$amount" } } },
        { $project: { _id: 0, key: "$_id", orders: 1, revenue: 1 } },
      ];
      return col.aggregate<RevenueRow>(pipeline, { maxTimeMS: 5_000 }).toArray();
    },
    async find(f: OrderFilter, sample: number) {
      const match: Document = {
        ...(f.customerId ? { customerId: f.customerId } : {}),
        ...(f.product ? { product: f.product } : {}),
        ...(f.city ? { city: f.city } : {}),
        ...(f.status ? { status: f.status } : {}),
        ...(f.minAmount !== undefined ? { amount: { $gte: f.minAmount } } : {}),
      };
      const [res] = await col
        .aggregate<{ total: Array<{ matched: number; totalAmount: number }>; sample: OrderDoc[] }>(
          [
            { $match: match },
            ...monthMatch(f),
            {
              $facet: {
                total: [{ $group: { _id: null, matched: { $sum: 1 }, totalAmount: { $sum: "$amount" } } }],
                sample: [{ $sort: { createdAt: -1 } }, { $limit: sample }, { $project: { _month: 0 } }],
              },
            },
          ],
          { maxTimeMS: 5_000 },
        )
        .toArray();
      const t = res?.total[0];
      return {
        matched: t?.matched ?? 0,
        totalAmount: t?.totalAmount ?? 0,
        sample: (res?.sample ?? []).map(({ _id, ...rest }) => ({ id: _id, ...rest })),
      };
    },
  };
}
