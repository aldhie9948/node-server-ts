import { Request, Router } from "express";
import moment from "moment";
import initKnex from "../lib/knex-config";

const router = Router();
const stok_barang_knex = initKnex("stok_barang");

function getPlant(req: Request) {
  let plant = req.query.plant as string;
  if (!plant) plant = "";
  return plant;
}

// ! UNIVERSAL ENDPOINT
router.get("/material/transactions", async function (req, res, next) {
  try {
    let start: string, end: string;
    const startQuery = req.query.start as string;
    const endQuery = req.query.end as string;
    const id = req.query.id as string;
    const plant = getPlant(req);

    if (!id) throw new Error("Part ID is undefined");

    if (!startQuery) start = moment().startOf("month").utc(true).toISOString();
    else start = moment(startQuery).utc(true).toISOString();
    if (!endQuery)
      end = moment().endOf("month").add(1, "d").utc(true).toISOString();
    else end = moment(endQuery).add(1, "d").utc(true).toISOString();

    const query = [
      "ig.kode_barang",
      "ig.nama_barang",
      "ig.satuan",
      stok_barang_knex.raw("IFNULL(ig.stok, 0) AS stok"),
      "hsb.tgl",
      "hsb.aktual",
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
      .whereBetween("hsb.tgl", [start, end])
      .where(function () {
        this.where("hsb.barang", id).where("ig.plant", "like", `%${plant}%`);
      })
      .where(function () {
        this.whereNotNull("hsb.tgl").andWhere("hsb.tgl", "!=", "0000-00-00");
      })
      .orderBy("hsb.tgl", "desc");
    console.log({ start, end });
    return res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/material/transactions/latest", async function (req, res, next) {
  try {
    const id = req.query.id as string;
    const category = req.query.category as string;
    const limit = req.query.limit as string;
    const plant = getPlant(req);
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
      .where("ig.plant", "like", `%${plant}%`)
      .where(function () {
        if (category === "raw-material") {
          this.where("ig.jenis_material", id).where(
            "ig.kategori",
            "like",
            "%RAW MATERIAL%"
          );
        } else if (category === "wip") {
          this.where("ig.gudang", id);
        }
      })
      .where(function () {
        this.whereNotNull("hsb.tgl").andWhere("hsb.tgl", "!=", "0000-00-00");
      })
      .orderBy("hsb.tgl", "desc")
      .limit(Number(limit) || 5);
    return res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/material/transactions/new", async function (req, res, next) {
  try {
    const { id, start, end, plant } = req.query;
    const results = await stok_barang_knex("transaksi_gudang AS tg")
      .select("*")
      .where(function () {
        this.where("tg.kode_barang", id).andWhere("tg.plant", plant);
      })
      .where(function () {
        const s = moment(<string>start)
          .utc(true)
          .toISOString();
        const e = moment(<string>end)
          .add(1, "d")
          .utc(true)
          .toISOString();
        this.whereBetween("tg.tgl", [s, e]);
      });

    return res.json(results);
  } catch (error) {
    next(error);
  }
});

// ! RAW MATERIAL ENDPOINT
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
          .whereNotNull("hsb.tgl")
          .andWhere("hsb.tgl", "!=", "0000-00-00");
      })
      .where("ig.plant", "like", `%${plant}%`)
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
            .where("ig.gudang", "like", "%Raw Material%")
            .andWhere("hsb.tgl", "!=", "0000-00-00");
        })
        .where("ig.plant", "like", `%${plant}%`)
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

// ! WIP ENDPOINT
router.get("/wip/category-items", async function (req, res, next) {
  try {
    const plant = getPlant(req);
    const query = ["ig.plant", "ig.gudang"];
    const result = await stok_barang_knex("item_gudang AS ig")
      .select(...query)
      .countDistinct("hsb.barang AS total")
      .innerJoin("histori_stok_barang AS hsb", "hsb.barang", "ig.kode_barang")
      .where(function () {
        this.where("ig.kategori", "like", "%wip%").orWhere(
          "ig.gudang",
          "like",
          "%wip%"
        );
      })
      .where("ig.plant", "like", `%${plant}%`)
      .orderBy("ig.gudang", "asc")
      .groupBy("ig.gudang");
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/wip/category/:warehouse", async function (req, res, next) {
  try {
    const warehouse = req.params.warehouse as string;
    const plant = getPlant(req);
    const query = [
      stok_barang_knex.raw("IF(ig.plant = '','Induk',ig.plant) AS plant"),
      "ig.gudang",
      "ig.kode_barang",
      "ig.nama_barang",
      "ig.satuan",
      stok_barang_knex.raw("IFNULL(ig.stok, 0) AS stok"),
      "ig.kategori",
    ];
    const result = await stok_barang_knex("item_gudang AS ig")
      .select(...query)
      .distinct("ig.kode_barang")
      .innerJoin("histori_stok_barang AS hsb", "hsb.barang", "ig.kode_barang")
      .where(function () {
        this.where("ig.gudang", warehouse)
          .where("ig.plant", "LIKE", `%${plant}%`)
          .where("ig.kategori", "LIKE", "%wip%");
      })
      .orderBy("ig.stok", "asc");
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
