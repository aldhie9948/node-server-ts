import { Router } from "express";
import initKnex from "../lib/knex-config";
import type { IPesananProdukForm } from "../lib/types";
import moment from "moment";

const router = Router();
const dbsb = initKnex("stok_barang");

router.post("/", async function (req, res, next) {
  try {
    const body = req.body as IPesananProdukForm;
    if (!Object.values(body).length) throw new Error("Body is undefined");
    Object.entries(body).forEach(([key, value]) => {
      if (!value) throw new Error(`${key} is required`);
    });
    await dbsb.transaction(async (trx) => {
      body.tgl_pesanan = moment(body.tgl_pesanan, "DD/MM/YYYY").format(
        "YYYY-MM-DD"
      );
      await trx("im_pesanan_produk").insert(body);
      console.log(body.customer.concat(" ", body.kode_barang, " tersimpan"));
    });
    return res.json({ status: "OK" });
  } catch (error) {
    next(error);
  }
});

export default router;
