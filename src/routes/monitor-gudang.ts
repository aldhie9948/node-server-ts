import { Router } from "express";
import initKnex from "../lib/knex-config";
import moment from "moment";

const router = Router();
const knex = initKnex("stok_barang");

router.get("/raw-material/latest", async function (req, res, next) {
  try {
    let { limit, code } = req.query;
    if (!limit || parseInt(<string>limit) < 1) limit = String(3);
    if (!code) throw new Error("Query param 'code' is required");
    const items = await knex
      .select(
        "stok_barang.nama_barang",
        "stok_barang.gudang",
        "histori_stok_barang.barang AS kode_barang",
        "histori_stok_barang.masuk",
        "histori_stok_barang.keluar",
        "histori_stok_barang.perubahan_stok AS sisa_stok",
        "histori_stok_barang.lot_material AS no_lot",
        "histori_stok_barang.aktual AS tanggal"
      )
      .from("histori_stok_barang")
      .innerJoin(
        "stok_barang",
        "histori_stok_barang.barang",
        "stok_barang.kode_barang"
      )
      .innerJoin(
        "item_kedatangan",
        "histori_stok_barang.barang",
        "item_kedatangan.kode_barang"
      )
      .innerJoin("tipe_barang", "item_kedatangan.tipe", "tipe_barang.kode")
      .where("histori_stok_barang.barang", code)
      .orWhere("tipe_barang.kode", code)
      .distinct("histori_stok_barang.id")
      .limit(parseInt(<string>limit));
    return res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get("/raw-material/:type", async function (req, res, next) {
  try {
    const { type } = req.params;
    const items = await knex
      .select(
        "stok_barang.kode_barang",
        "stok_barang.nama_barang",
        "stok_barang.satuan",
        "stok_barang.kategori",
        "stok_barang.tipe_barang",
        "stok_barang.gudang",
        "stok_barang.active",
        "stok_barang.stok",
        "tipe_barang.kode AS kode_tipe",
        "tipe_barang.nama AS nama_tipe"
      )
      .from("stok_barang")
      .innerJoin(
        "item_kedatangan",
        "stok_barang.kode_barang",
        "item_kedatangan.kode_barang"
      )
      .innerJoin("tipe_barang", "item_kedatangan.tipe", "tipe_barang.kode")
      .where("tipe_barang.kode", type)
      .distinct("stok_barang.kode_barang")
      .orderBy("stok_barang.stok", "asc");
    return res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post("/raw-material", async function (req, res, next) {
  try {
    let { start, end, code, limit } = req.body;
    if (!limit || parseInt(<string>limit) < 1) limit = String(9999);
    if (!start) start = moment().startOf("month").utc().format();
    if (!end) end = moment().endOf("month").utc().format();
    if (!code) throw new Error("Body param 'code' is required");
    const items = await knex
      .select(
        "stok_barang.nama_barang",
        "stok_barang.gudang",
        "histori_stok_barang.barang AS kode_barang",
        "histori_stok_barang.masuk",
        "histori_stok_barang.keluar",
        "histori_stok_barang.perubahan_stok AS sisa_stok",
        "histori_stok_barang.lot_material AS no_lot",
        "histori_stok_barang.aktual AS tanggal"
      )
      .from("histori_stok_barang")
      .innerJoin(
        "stok_barang",
        "histori_stok_barang.barang",
        "stok_barang.kode_barang"
      )
      .innerJoin(
        "item_kedatangan",
        "stok_barang.kode_barang",
        "item_kedatangan.kode_barang"
      )
      .innerJoin("tipe_barang", "item_kedatangan.tipe", "tipe_barang.kode")
      .whereBetween("histori_stok_barang.aktual", [start, end])
      .where("histori_stok_barang.barang", code)
      .orWhere("tipe_barang.kode", code)
      .limit(parseInt(limit))
      .orderBy("histori_stok_barang.aktual", "desc");

    return res.json(items);
  } catch (error) {
    next(error);
  }
});

const monitorGudang = router;
export default monitorGudang;
