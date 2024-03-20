import { Router } from "express";
import initKnex from "../lib/knex-config";
import type { IPesananProdukForm } from "../lib/types";
import moment from "moment";
import _ from "lodash";
import { verifyAuthorization } from "../lib/utils";

const router = Router();
const dbsb = initKnex("stok_barang");

router.post("/", async function (req, res, next) {
  try {
    verifyAuthorization(req);
    const body = req.body as IPesananProdukForm[];
    if (!Object.values(body).length) throw new Error("Body is undefined");
    const keys = [
      "tgl_pesanan",
      "no_pesanan",
      "customer",
      "kode_barang",
      "nama_barang",
      "qty",
      "satuan",
      "harga",
    ].sort();
    await dbsb.transaction(async (trx) => {
      const data = body.map((b) => {
        const bodyKeys = Object.keys(b).sort();
        if (!_.isEqual(keys, bodyKeys)) throw new Error("Invalid Body");
        b.tgl_pesanan = moment(b.tgl_pesanan).format("YYYY-MM-DD");
        return b;
      });
      await trx("im_pesanan_produk").insert(data);
    });
    return res.json({ status: "OK" });
  } catch (error) {
    next(error);
  }
});

export default router;
