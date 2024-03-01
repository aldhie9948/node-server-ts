import { Router } from "express";
import initKnex from "../lib/knex-config";
const router = Router();
const knex = initKnex("stok_barang");

// for main application
router.get("/", async function (req, res, next) {
  try {
    const { plan } = req.query;
    if (!plan) throw new Error("Query param 'plan' is required");
    const selectQuery = [
      knex.raw("IFNULL(hp.shift,'') AS shift"),
      knex.raw("IFNULL(hp.no_rencana,'') AS no_plan"),
      knex.raw("IFNULL(hp.bagian,'') AS no_bagian"),
      knex.raw("IFNULL(area.nama_area,'') AS nama_area"),
      knex.raw("IFNULL(hp.tgl_dokumen,'') AS tanggal"),
      knex.raw("IFNULL(hp.barang,'') AS barang"),
      knex.raw("IFNULL(hp.operator,'') AS operator"),
      knex.raw("IFNULL(hp.kode_mesin,'') AS kode_mesin"),
      knex.raw("IFNULL(hp.satuan,'') AS satuan"),
      knex.raw("IFNULL(pp.qty,0) AS plan"),
      knex.raw("IFNULL(pp.mulai,'') AS start"),
      knex.raw("IFNULL(pp.selesai,'') AS finish"),
      knex.raw("IFNULL(hp.01,0) AS `01`"),
      knex.raw("IFNULL(IF(hp.`02` = 0, 0, hp.`02` - hp.`01`),0) AS `02`"),
      knex.raw("IFNULL(IF(hp.`03` = 0, 0, hp.`03` - hp.`02`),0) AS `03`"),
      knex.raw("IFNULL(IF(hp.`04`= 0, 0, hp.`04` - hp.`03`),0) AS `04`"),
      knex.raw("IFNULL(IF(hp.`05` = 0, 0, hp.`05` - hp.`04`),0) AS `05`"),
      knex.raw("IFNULL(IF(hp.`06` = 0, 0, hp.`06` - hp.`05`),0) AS `06`"),
      knex.raw("IFNULL(IF(hp.`07` = 0, 0,hp.`07` - hp.`06`),0) AS `07`"),
      knex.raw("IFNULL(hp.reject,0) AS NG"),
      knex.raw(
        "IFNULL(hp.`01`,0) + IFNULL((hp.`02` - hp.`01`),0) + IFNULL(hp.`03` - hp.`02`,0) + IFNULL(hp.`04` - hp.`03`,0) + IFNULL(hp.`05` - hp.`04`,0) + IFNULL(hp.`06` - hp.`05`,0) + IFNULL(hp.`07` - hp.`06`,0) AS OK"
      ),
      knex.raw("IFNULL(hp.keterangan,'') AS keterangan"),
      knex.raw("IFNULL(hp.lot,'') AS lot_material"),
      knex.raw("IFNULL(kry.nm_depan_karyawan,'') AS nama_operator"),
    ];
    const items = await knex
      .select(...selectQuery)
      .from("hasil_produksi AS hp")
      .joinRaw(
        "LEFT JOIN `m-payroll`.data_karyawan AS kry ON FIND_IN_SET(kry.nik, hp.operator)"
      )
      .leftOuterJoin("im_area AS area", "hp.bagian", "area.kode_area")
      .leftOuterJoin("plan_produksi AS pp", function () {
        this.on("pp.id_barang", "hp.barang").andOn(
          "pp.plan_no",
          "hp.no_rencana"
        );
      })
      .where("hp.no_rencana", <string>plan)
      .orderBy("hp.barang");
    return res.json(items);
  } catch (error) {
    next(error);
  }
});

// for component svelte-select
router.get("/:no_plan", async function (req, res, next) {
  try {
    const { no_plan } = req.params;
    const items = await knex
      .select("area.nama_area")
      .from("hasil_produksi AS hp")
      .leftOuterJoin("im_area AS area", "hp.bagian", "area.kode_area")
      .leftOuterJoin("plan_produksi AS pp", function () {
        this.on("pp.id_barang", "hp.barang").andOn(
          "pp.plan_no",
          "hp.no_rencana"
        );
      })
      .distinct("hp.no_rencana AS no_plan")
      .where("hp.no_rencana", "like", `%${no_plan}%`)
      .limit(100)
      .orderBy("pp.plan_no", "asc");
    return res.json(
      items.map((i) => ({
        value: i.no_plan,
        label: "No. Plan: " + i.no_plan,
        group: !i.nama_area ? "OTHER" : i.nama_area,
      }))
    );
  } catch (error) {
    next(error);
  }
});

export default router;
