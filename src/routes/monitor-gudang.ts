import { Router } from "express";
import initKnex from "../lib/knex-config";
import moment from "moment";
import _ from "lodash";

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
        "stok_barang.satuan",
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

router.get("/raw-material/items-type", async function (req, res, next) {
  try {
    const itemsType = await knex.from("tipe_barang");
    const items = await Promise.all(
      itemsType.map(async (t) => {
        const itemsByType = await knex
          .from("stok_barang")
          .innerJoin(
            "item_kedatangan",
            "stok_barang.kode_barang",
            "item_kedatangan.kode_barang"
          )
          .innerJoin("tipe_barang", "item_kedatangan.tipe", "tipe_barang.kode")
          .where("tipe_barang.kode", t?.kode)
          .distinct("stok_barang.kode_barang");
        let total = itemsByType.length;
        return { ...t, total };
      })
    );
    return res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post("/raw-material/part-items", async function (req, res, next) {
  try {
    // raw material code
    const { id } = req.body;
    if (!id) throw new Error("Body param 'id' is required");
    const items = await knex
      .select(
        "bom_all_level_1.id",
        "bom_all_level_1.jenis_barang",
        "bom_all_level_1.kode_barang AS kode_material",
        "bom_all_level_1.nama_barang AS material",
        "bom_all_level_1.satuan",
        "bom_all_level_1.induk AS kode_barang",
        "tbl_barang.nama_barang",
        knex.raw("IFNULL(bom_all_level_1.bruto, 0) AS bruto"),
        knex.raw("IFNULL(1/bruto, 0) AS hasil_pcs")
      )
      .from("bom_all_level_1")
      .innerJoin(
        "tbl_barang",
        "bom_all_level_1.induk",
        "tbl_barang.kode_barang"
      )
      .distinct("bom_all_level_1.induk")
      .where("bom_all_level_1.jenis_barang", "like", "%Raw Material%")
      .where("bom_all_level_1.kode_barang", id)
      .orderBy("bom_all_level_1.urutan", "desc");
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
        "histori_stok_barang.tgl AS tanggal"
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
      .distinct("histori_stok_barang.id")
      .limit(parseInt(limit))
      .orderBy("histori_stok_barang.aktual", "desc")
      .orderBy("histori_stok_barang.tgl", "desc");

    return res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get("/material-cust", async function (req, res, next) {
  try {
    const items = await knex
      .from("tbl_barang")
      .where("kategori", "like", "%material cust%");
    const omittedItems = _.map(
      items,
      _.partial(_.omit, _, [
        "cycletime",
        "cycletime_welding",
        "pjg_welding",
        "mesin",
        "cvt",
      ])
    );
    return res.json(omittedItems);
  } catch (error) {
    next(error);
  }
});

const monitorGudang = router;
export default monitorGudang;
