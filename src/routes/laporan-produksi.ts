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
      knex.raw("IFNULL(hasil_produksi.shift,'') AS shift"),
      knex.raw("IFNULL(hasil_produksi.no_rencana,'') AS no_plan"),
      knex.raw("IFNULL(hasil_produksi.bagian,'') AS no_bagian"),
      knex.raw("IFNULL(area.nama_area,'') AS nama_area"),
      knex.raw("IFNULL(hasil_produksi.tgl_dokumen,'') AS tanggal"),
      knex.raw("IFNULL(hasil_produksi.barang,'') AS barang"),
      knex.raw("IFNULL(hasil_produksi.operator,'') AS operator"),
      knex.raw("IFNULL(hasil_produksi.kode_mesin,'') AS kode_mesin"),
      knex.raw("IFNULL(hasil_produksi.satuan,'') AS satuan"),
      knex.raw("IFNULL(plan_produksi.qty,0) AS plan"),
      knex.raw("IFNULL(plan_produksi.mulai,'') AS start"),
      knex.raw("IFNULL(plan_produksi.selesai,'') AS finish"),
      knex.raw("IFNULL(hasil_produksi.01,0) AS `01`"),
      knex.raw(
        "IFNULL(IF(hasil_produksi.`02` = 0, 0, hasil_produksi.`02` - hasil_produksi.`01`),0) AS `02`"
      ),
      knex.raw(
        "IFNULL(IF(hasil_produksi.`03` = 0, 0, hasil_produksi.`03` - hasil_produksi.`02`),0) AS `03`"
      ),
      knex.raw(
        "IFNULL(IF(hasil_produksi.`04`= 0, 0, hasil_produksi.`04` - hasil_produksi.`03`),0) AS `04`"
      ),
      knex.raw(
        "IFNULL(IF(hasil_produksi.`05` = 0, 0, hasil_produksi.`05` - hasil_produksi.`04`),0) AS `05`"
      ),
      knex.raw(
        "IFNULL(IF(hasil_produksi.`06` = 0, 0, hasil_produksi.`06` - hasil_produksi.`05`),0) AS `06`"
      ),
      knex.raw(
        "IFNULL(IF(hasil_produksi.`07` = 0, 0,hasil_produksi.`07` - hasil_produksi.`06`),0) AS `07`"
      ),
      knex.raw("IFNULL(hasil_produksi.reject,0) AS NG"),
      knex.raw(
        "IFNULL(hasil_produksi.`01`,0) + IFNULL((hasil_produksi.`02` - hasil_produksi.`01`),0) + IFNULL(hasil_produksi.`03` - hasil_produksi.`02`,0) + IFNULL(hasil_produksi.`04` - hasil_produksi.`03`,0) + IFNULL(hasil_produksi.`05` - hasil_produksi.`04`,0) + IFNULL(hasil_produksi.`06` - hasil_produksi.`05`,0) + IFNULL(hasil_produksi.`07` - hasil_produksi.`06`,0) AS OK"
      ),
      knex.raw("IFNULL(hasil_produksi.keterangan,'') AS keterangan"),
      knex.raw("IFNULL(hasil_produksi.no_rencana,'') AS lot"),
      knex.raw("IFNULL(karyawan.nm_depan_karyawan,'') AS nama_depan"),
      knex.raw("IFNULL(karyawan.nm_belakang_karyawan,'') AS nama_belakang"),
      knex.raw(
        'CONCAT(IFNULL(karyawan.nm_depan_karyawan,"")," ",IFNULL(karyawan.nm_belakang_karyawan,"")) AS nama_operator'
      ),
    ];
    const items = await knex
      .select(...selectQuery)
      .from("hasil_produksi")
      .joinRaw(
        "LEFT JOIN `mms-payroll`.data_karyawan AS karyawan ON hasil_produksi.operator = karyawan.nik"
      )
      .leftOuterJoin(
        "im_area AS area",
        "hasil_produksi.bagian",
        "area.kode_area"
      )
      .leftOuterJoin("plan_produksi", function () {
        this.on("plan_produksi.id_barang", "hasil_produksi.barang").andOn(
          "plan_produksi.plan_no",
          "hasil_produksi.no_rencana"
        );
      })
      .where("hasil_produksi.no_rencana", <string>plan);
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
      .select("im_area.nama_area")
      .from("hasil_produksi")
      .leftOuterJoin("im_area", "hasil_produksi.bagian", "im_area.kode_area")
      .leftOuterJoin("plan_produksi", function () {
        this.on("plan_produksi.id_barang", "hasil_produksi.barang").andOn(
          "plan_produksi.plan_no",
          "hasil_produksi.no_rencana"
        );
      })
      .distinct("hasil_produksi.no_rencana AS no_plan")
      .where("hasil_produksi.no_rencana", "like", `%${no_plan}%`)
      .limit(100)
      .orderBy("plan_produksi.plan_no", "asc");
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

const laporanProduksi = router;
export default laporanProduksi;
