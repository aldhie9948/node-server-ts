import { Router } from "express";
import initKnex from "../lib/knex-config";

const router = Router();
const knex = initKnex("stok_barang");

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

router.get("/", async function (req, res, next) {
  try {
    let { limit } = req.query;
    if (!limit || parseInt(<string>limit) < 1) limit = "50";
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

router.get("/:query", async (req, res, next) => {
  try {
    const { query } = req.params;
    if (!query) throw new Error("Query params item code or name is required");
    const items = await knex
      .select("kode_barang", "nama_barang", "qrcode")
      .from("tbl_barang")
      .distinct("kode_barang")
      .where("kode_barang", "like", `%${query}%`)
      .orWhere("nama_barang", "like", `%${query}%`)
      .limit(50);

    return res.json(
      items.map((i) => ({
        value: i.kode_barang,
        label: i.nama_barang + " | " + i.kode_barang,
      }))
    );
  } catch (error) {
    next(error);
  }
});

const portalLaporan = router;
export default portalLaporan;
