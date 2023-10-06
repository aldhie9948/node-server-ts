import { Router } from "express";
import initKnex from "../lib/knex-config";

const router = Router();
const knex = initKnex("stok_barang");

router.get("/", async (req, res, next) => {
  try {
    let { limit } = req.query;
    if (!limit) limit = String(100);
    const items = await knex
      .select("kode_barang", "nama_barang", "qrcode")
      .from("tbl_barang")
      .distinct("kode_barang")
      .limit(parseInt(<string>limit));
    return res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    let { limit } = req.query;
    const { keyword } = req.body;
    if (!limit || parseInt(<string>limit) < 1) limit = String(100);
    if (keyword === undefined)
      throw new Error("Body param 'keyword' is required");
    const items = await knex
      .select("kode_barang", "nama_barang", "qrcode")
      .from("tbl_barang")
      .distinct("kode_barang")
      .where("nama_barang", "like", `%${keyword}%`)
      .orWhere("kode_barang", "like", `%${keyword}%`)
      .limit(parseInt(<string>limit));
    return res.json(items);
  } catch (error) {
    next(error);
  }
});

const portalLaporan = router;
export default portalLaporan;
