import { Router, Request } from "express";
import initKnex from "../lib/knex-config";
import moment from "moment";

const router = Router();
const stok_barang_knex = initKnex("stok_barang");

function getPlant(req: Request) {
  let plant = req.query.plant as string;
  if (!plant || ["all", "induk"].includes(plant.toLowerCase())) plant = "";
  return plant;
}

router.get("/raw-material/category-items", async function (req, res, next) {
  try {
    const plant = getPlant(req);
    const query = ["tb.kode", "tb.nama", "tb.jenis"];
    const results = await stok_barang_knex("tipe_barang AS tb")
      .select(...query)
      .countDistinct("ig.kode_barang AS total")
      .leftJoin("item_gudang AS ig", "ig.jenis_material", "tb.kode")
      .innerJoin("histori_stok_barang AS hsb", "hsb.barang", "ig.kode_barang")
      .where(function () {
        this.where("ig.kategori", "like", "%RAW MATERIAL%")
          .where("hsb.plant", "like", `%${plant}%`)
          .whereNotNull("hsb.tgl")
          .andWhere("hsb.tgl", "!=", "0000-00-00");
      })
      .groupBy("tb.kode");
    return res.json(results);
  } catch (error) {
    next(error);
  }
});

router.get(
  "/raw-material/category/:categoryId",
  async function (req, res, next) {
    try {
      const plant = getPlant(req);
      const { categoryId } = req.params;
      const query = [
        stok_barang_knex.raw("IF(ig.plant = '','Induk',ig.plant) AS plant"),
        "ig.gudang",
        "ig.kode_barang",
        "ig.nama_barang",
        "ig.jenis_material",
        "ig.satuan",
        stok_barang_knex.raw("IFNULL(ig.stok, 0) AS stok"),
        "tp.nama AS nama_material",
        "ig.kategori",
      ];
      const result = await stok_barang_knex("item_gudang AS ig")
        .select(...query)
        .distinct("ig.kode_barang")
        .innerJoin("histori_stok_barang AS hsb", "hsb.barang", "ig.kode_barang")
        .leftJoin("tipe_barang AS tp", "tp.kode", "ig.jenis_material")
        .where(function () {
          this.where("ig.jenis_material", "like", categoryId)
            .where("hsb.plant", "like", `%${plant}%`)
            .where("ig.kategori", "like", "%RAW MATERIAL%")
            .andWhere("hsb.tgl", "!=", "0000-00-00");
        })
        .orderBy("ig.stok", "asc");
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get("/raw-material/part-items/:partId", async function (req, res, next) {
  try {
    const { partId } = req.params;
    const query = [
      "bal1.id",
      "bal1.jenis_barang",
      "bal1.kode_barang AS kode_material",
      "bal1.nama_barang AS material",
      "bal1.satuan",
      "bal1.induk AS kode_barang",
      "tb.nama_barang",
      stok_barang_knex.raw("IFNULL(bal1.bruto,0) AS bruto"),
      stok_barang_knex.raw("IFNULL(1 / bruto, 0) AS hasil_pcs"),
    ];
    const result = await stok_barang_knex("bom_all_level_1 AS bal1")
      .select(...query)
      .innerJoin("tbl_barang AS tb", "bal1.induk", "tb.kode_barang")
      .distinct("bal1.induk")
      .where(function () {
        this.where("bal1.jenis_barang", "like", "%Raw Material%").where(
          "bal1.kode_barang",
          partId
        );
      })
      .orderBy("bal1.urutan", "desc")
      .groupBy("bal1.induk");
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/raw-material/transactions", async function (req, res, next) {
  try {
    let start: string, end: string;
    const startQuery = req.query.start as string;
    const endQuery = req.query.end as string;
    const partId = req.query.part as string;
    const plant = getPlant(req);

    if (!partId) throw new Error("Part ID is undefined");

    if (!startQuery) start = moment().startOf("month").utc(true).format();
    else start = moment(startQuery).utc(true).format();
    if (!endQuery) end = moment().endOf("month").utc(true).format();
    else end = moment(endQuery).utc(true).format();
    const query = [
      "ig.kode_barang",
      "ig.nama_barang",
      "ig.satuan",
      stok_barang_knex.raw("IFNULL(ig.stok, 0) AS stok"),
      "hsb.tgl",
      "hsb.masuk",
      "hsb.keluar",
      stok_barang_knex.raw("IFNULL(hsb.perubahan_stok,0) AS stok_awal"),
      stok_barang_knex.raw(
        "IFNULL((IFNULL(hsb.perubahan_stok,0) + IFNULL(hsb.masuk,0) - IFNULL(hsb.keluar,0)),0) AS perubahan_stok"
      ),
      "hsb.lot_material",
      "ig.gudang",
      stok_barang_knex.raw("IF(hsb.plant='','Induk',hsb.plant) AS plant"),
      "ig.jenis_material",
      "tp.nama AS nama_material",
    ];
    const data = await stok_barang_knex("item_gudang AS ig")
      .select(...query)
      .innerJoin("histori_stok_barang AS hsb", "hsb.barang", "ig.kode_barang")
      .leftJoin("tipe_barang AS tp", "tp.kode", "ig.jenis_material")
      .where(function () {
        this.where("hsb.plant", "like", `%${plant}%`)

          .whereNotNull("hsb.tgl")
          .andWhere("hsb.tgl", "!=", "0000-00-00");
      })
      .where("hsb.barang", partId)
      .whereBetween("hsb.aktual", [start, end])
      .orderBy("hsb.tgl", "desc");
    return res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get(
  "/raw-material/transactions/latest",
  async function (req, res, next) {
    try {
      const categoryId = req.query.categoryId as string;
      const limit = req.query.limit as string;
      const plant = getPlant(req);

      if (!categoryId) throw new Error("Part Type is undefined");
      const query = [
        "ig.kode_barang",
        "ig.nama_barang",
        "ig.satuan",
        stok_barang_knex.raw("IFNULL(ig.stok, 0) AS stok"),
        "hsb.tgl",
        "hsb.masuk",
        "hsb.keluar",
        stok_barang_knex.raw("IFNULL(hsb.perubahan_stok,0) AS stok_awal"),
        stok_barang_knex.raw(
          "IFNULL((IFNULL(hsb.perubahan_stok,0) + IFNULL(hsb.masuk,0) - IFNULL(hsb.keluar,0)),0) AS perubahan_stok"
        ),
        "hsb.lot_material",
        "ig.gudang",
        stok_barang_knex.raw("IF(hsb.plant='','Induk',hsb.plant) AS plant"),
        "ig.jenis_material",
        "tp.nama AS nama_material",
      ];
      const data = await stok_barang_knex("item_gudang AS ig")
        .select(...query)
        .innerJoin("histori_stok_barang AS hsb", "hsb.barang", "ig.kode_barang")
        .leftJoin("tipe_barang AS tp", "tp.kode", "ig.jenis_material")
        .where(function () {
          this.where("hsb.plant", "like", `%${plant}%`)
            .whereNotNull("hsb.tgl")
            .andWhere("hsb.tgl", "!=", "0000-00-00");
        })
        .where(function () {
          this.where("ig.jenis_material", categoryId).where(
            "ig.kategori",
            "like",
            "%RAW MATERIAL%"
          );
        })
        .where(function () {
          this.where("hsb.masuk", "!=", 0).orWhere("hsb.keluar", "!=", 0);
        })
        .limit(Number(limit) || 5)
        .orderBy("hsb.tgl", "desc");
      return res.json(data);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
