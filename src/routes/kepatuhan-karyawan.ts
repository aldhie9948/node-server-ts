import { Router } from "express";
import initKnex from "../lib/knex-config";
import moment from "moment";
const router = Router();
const db = initKnex("stok_barang");

// ! ITEM ENDPOINT
// get press document by date
router.get("/press/date/:keyword", async function (req, res, next) {
  try {
    const { keyword } = req.params;
    const query = [
      "kko.id",
      "kko.id_stok_masuk_detail",
      db.raw("IFNULL(kko.nik, 0) AS nik"),
      "kko.karyawan",
      db.raw("UPPER(kko.proses) AS proses"),
      db.raw("IFNULL(kko.checksheet, 0) AS checksheet"),
      db.raw("IFNULL(kko.verifikasi_setup, 0) AS verifikasi_setup"),
      db.raw("IFNULL(kko.sensor, 0) AS sensor"),
      db.raw("IFNULL(kko.kondisi_sensor, 0) AS kondisi_sensor"),
      db.raw("IFNULL(kko.sop, 0) AS sop"),
      db.raw("IFNULL(kko.kesesuaian_sop, 0) AS kesesuaian_sop"),
      db.raw("IFNULL(kko.ear_plug, 0) AS ear_plug"),
      db.raw("IFNULL(kko.sepatu_safety, 0) AS sepatu_safety"),
      db.raw("IFNULL(kko.ganjal_tombol, 0) AS ganjal_tombol"),
      db.raw("IFNULL(kko.oli_sampah, 0) AS oli_sampah"),
      db.raw("IFNULL(kko.line_mesin, 0) AS line_mesin"),
      db.raw("IFNULL(kko.jig_proses, 0) AS jig_proses"),
      db.raw("IFNULL(kko.history_card, 0) AS history_card"),
      "kko.catatan",
      "kko.tgl",
      "kko.area",
      "ppt.kode_mesin AS kode_mesin",
    ];
    const results = await db("kontrol_kepatuhan_operator AS kko")
      .select(...query)
      .leftOuterJoin("ppc_tonase AS ppt", "ppt.id", "kko.id_mesin")
      .where(function () {
        this.whereNot("kko.nik", "").whereNot("kko.karyawan", "");
      })
      .where("kko.tgl", keyword)
      .orderBy("kko.karyawan", "asc");

    return res.json(results);
  } catch (error) {
    next(error);
  }
});

// get press document by worker
router.get("/press/worker/:keyword", async function (req, res, next) {
  try {
    const { keyword } = req.params;
    const query = [
      "kko.id",
      "kko.id_stok_masuk_detail",
      db.raw("IFNULL(kko.nik, 0) AS nik"),
      "kko.karyawan",
      db.raw("UPPER(kko.proses) AS proses"),
      db.raw("IFNULL(kko.checksheet, 0) AS checksheet"),
      db.raw("IFNULL(kko.verifikasi_setup, 0) AS verifikasi_setup"),
      db.raw("IFNULL(kko.sensor, 0) AS sensor"),
      db.raw("IFNULL(kko.kondisi_sensor, 0) AS kondisi_sensor"),
      db.raw("IFNULL(kko.sop, 0) AS sop"),
      db.raw("IFNULL(kko.kesesuaian_sop, 0) AS kesesuaian_sop"),
      db.raw("IFNULL(kko.ear_plug, 0) AS ear_plug"),
      db.raw("IFNULL(kko.sepatu_safety, 0) AS sepatu_safety"),
      db.raw("IFNULL(kko.ganjal_tombol, 0) AS ganjal_tombol"),
      db.raw("IFNULL(kko.oli_sampah, 0) AS oli_sampah"),
      db.raw("IFNULL(kko.line_mesin, 0) AS line_mesin"),
      db.raw("IFNULL(kko.jig_proses, 0) AS jig_proses"),
      db.raw("IFNULL(kko.history_card, 0) AS history_card"),
      "kko.catatan",
      "kko.tgl",
      "kko.area",
      "pt.kode_mesin AS kode_mesin",
    ];
    const results = await db("kontrol_kepatuhan_operator AS kko")
      .select(...query)
      .leftOuterJoin("ppc_tonase AS pt", "pt.id", "kko.id_mesin")
      .where(function () {
        const [year, month] = keyword.split("-");
        this.where("kko.nik", "like", keyword)
          .orWhere("kko.karyawan", "like", keyword)
          .orWhereRaw("YEAR(kko.tgl) = ? AND MONTH(kko.tgl) = ?", [
            year || "",
            month || "",
          ]);
      })
      .where(function () {
        this.whereNot("kko.nik", "").whereNot("kko.karyawan", "");
      })
      .orderBy("kko.karyawan", "asc")
      .orderBy("kko.tgl", "asc");
    return res.json(results);
  } catch (error) {
    next(error);
  }
});

// get welding document by date
router.get("/welding/date/:keyword", async function (req, res, next) {
  try {
    const { keyword } = req.params;
    const query = [
      "kkow.id",
      "kkow.id_stok_masuk_detail",
      "kkow.tgl",
      "kkow.nik",
      "kkow.karyawan",
      "kkow.id_mesin",
      db.raw("UPPER(kkow.proses) AS proses"),
      db.raw("IFNULL(kkow.checksheet,0) AS checksheet"),
      db.raw("IFNULL(kkow.verifikasi_setup,0) AS verifikasi_setup"),
      db.raw("IFNULL(kkow.sop,0) AS sop"),
      db.raw("IFNULL(kkow.topi_kerja,0) AS topi_kerja"),
      db.raw("IFNULL(kkow.sepatu_safety,0) AS sepatu_safety"),
      db.raw("IFNULL(kkow.appron_dada,0) AS appron_dada"),
      db.raw("IFNULL(kkow.masker,0) AS masker"),
      db.raw("IFNULL(kkow.alat_bantu_kerja,0) AS alat_bantu_kerja"),
      db.raw("IFNULL(kkow.oli_sampah,0) AS oli_sampah"),
      db.raw("IFNULL(kkow.line_mesin,0) AS line_mesin"),
      db.raw("IFNULL(kkow.jig_proses,0) AS jig_proses"),
      db.raw("IFNULL(kkow.history_card,0) AS history_card"),
      "kkow.catatan",
      "kkow.area",
      "ppt.kode_mesin AS kode_mesin",
    ];
    const results = await db("kontrol_kepatuhan_operator_welding AS kkow")
      .select(...query)
      .leftOuterJoin("ppc_tonase AS ppt", "ppt.id", "kkow.id_mesin")
      .where("kkow.tgl", keyword)
      .where(function () {
        this.whereNot("kkow.nik", "").whereNot("kkow.karyawan", "");
      })
      .orderBy("kkow.karyawan", "asc");
    return res.json(results);
  } catch (error) {
    next(error);
  }
});

// get welding document by worker
router.get("/welding/worker/:keyword", async function (req, res, next) {
  try {
    const { keyword } = req.params;
    const query = [
      "kkow.id",
      "kkow.id_stok_masuk_detail",
      "kkow.tgl",
      "kkow.nik",
      "kkow.karyawan",
      "kkow.id_mesin",
      db.raw("UPPER(kkow.proses) AS proses"),
      db.raw("IFNULL(kkow.checksheet,0) AS checksheet"),
      db.raw("IFNULL(kkow.verifikasi_setup,0) AS verifikasi_setup"),
      db.raw("IFNULL(kkow.sop,0) AS sop"),
      db.raw("IFNULL(kkow.topi_kerja,0) AS topi_kerja"),
      db.raw("IFNULL(kkow.sepatu_safety,0) AS sepatu_safety"),
      db.raw("IFNULL(kkow.appron_dada,0) AS appron_dada"),
      db.raw("IFNULL(kkow.masker,0) AS masker"),
      db.raw("IFNULL(kkow.alat_bantu_kerja,0) AS alat_bantu_kerja"),
      db.raw("IFNULL(kkow.oli_sampah,0) AS oli_sampah"),
      db.raw("IFNULL(kkow.line_mesin,0) AS line_mesin"),
      db.raw("IFNULL(kkow.jig_proses,0) AS jig_proses"),
      db.raw("IFNULL(kkow.history_card,0) AS history_card"),
      "kkow.catatan",
      "kkow.area",
      "ppt.kode_mesin AS kode_mesin",
    ];
    const results = await db("kontrol_kepatuhan_operator_welding AS kkow")
      .select(...query)
      .leftOuterJoin("ppc_tonase AS ppt", "ppt.id", "kkow.id_mesin")
      .where(function () {
        const [year, month] = keyword;
        this.where("kkow.nik", "like", keyword)
          .orWhere("kkow.karyawan", "like", keyword)
          .orWhereRaw("YEAR(kkow.tgl) = ? AND MONTH(kkow.tgl) = ?", [
            year || "",
            month || "",
          ]);
      })
      .where(function () {
        this.whereNot("kkow.nik", "").whereNot("kkow.karyawan", "");
      })
      .orderBy("kkow.karyawan", "asc")
      .orderBy("kkow.tgl", "asc");
    return res.json(results);
  } catch (error) {
    next(error);
  }
});

// ! SELECT ENDPOINT
// find press documents by date for select component
router.get("/press/select/date/:keyword", async function (req, res, next) {
  try {
    const { keyword } = req.params;
    const results = await db("kontrol_kepatuhan_operator AS kko")
      .select("kko.tgl")
      .distinct("kko.tgl")
      .where("kko.tgl", "LIKE", `%${keyword}%`)
      .orderBy("kko.tgl", "desc")
      .limit(20);
    return res.json(
      results.map((i) => ({
        value: i.tgl,
        label: i.tgl,
        type: "date",
      }))
    );
  } catch (error) {
    next(error);
  }
});

// find press documents by worker for select component
router.get("/press/select/worker/:keyword", async function (req, res, next) {
  try {
    const { keyword } = req.params;
    const results = await db("kontrol_kepatuhan_operator AS kko")
      .select("kko.karyawan")
      .distinct("kko.nik")
      .where(function () {
        this.where("kko.nik", "like", `%${keyword}%`).orWhere(
          "kko.karyawan",
          "like",
          `%${keyword}%`
        );
      })
      .groupBy("kko.nik")
      .orderBy("kko.karyawan", "asc")
      .limit(20);
    return res.json(
      results.map((i) => ({
        value: i.nik || i.karyawan,
        label: i.karyawan.concat(" | ", i.nik || "-"),
        type: "worker",
      }))
    );
  } catch (error) {
    next(error);
  }
});

// find press document by month for select component
router.get("/press/select/month/:month", async function (req, res, next) {
  try {
    const { month } = req.params;
    const results = await db("kontrol_kepatuhan_operator AS kko")
      .select(db.raw("kko.tgl"))
      .where(function () {
        this.whereRaw("MONTH(kko.tgl) LIKE ?", month);
      })
      .limit(50)
      .groupByRaw("MONTH(kko.tgl)")
      .groupByRaw("YEAR(kko.tgl)")
      .orderBy("kko.tgl", "desc");
    return res.json(
      results.map((r) => ({
        value: moment(r.tgl).utc(true).format("YYYY-MM"),
        label: moment(r.tgl).utc(true).format("MMMM YYYY"),
        type: "worker",
      }))
    );
  } catch (error) {
    next(error);
  }
});

// find welding documents by date for select component
router.get("/welding/select/date/:keyword", async function (req, res, next) {
  try {
    const { keyword } = req.params;
    const results = await db("kontrol_kepatuhan_operator_welding AS kkow")
      .select("kkow.tgl")
      .distinct("kkow.tgl")
      .where("kkow.tgl", "LIKE", "%".concat(keyword, "%"))
      .orderBy("kkow.tgl", "desc")
      .limit(20);
    return res.json(
      results.map((i) => ({
        value: i.tgl,
        label: i.tgl,
        type: "date",
      }))
    );
  } catch (error) {
    next(error);
  }
});

// find welding documents by worker for select component
router.get("/welding/select/worker/:keyword", async function (req, res, next) {
  try {
    const { keyword } = req.params;
    const results = await db("kontrol_kepatuhan_operator_welding AS kkow")
      .select("kkow.karyawan")
      .distinct("kkow.nik")
      .where("kkow.nik", "LIKE", "%".concat(keyword, "%"))
      .orWhere("kkow.karyawan", "LIKE", "%".concat(keyword, "%"))
      .groupBy("kkow.nik")
      .orderBy("kkow.karyawan", "asc")
      .limit(20);
    return res.json(
      results.map((i) => ({
        value: i.nik || i.karyawan,
        label: i.karyawan.concat(" | ", i.nik || "-"),
        type: "worker",
      }))
    );
  } catch (error) {
    next(error);
  }
});

// find welding document by month for select component
router.get("/welding/select/month/:month", async function (req, res, next) {
  try {
    const { month } = req.params;
    const results = await db("kontrol_kepatuhan_operator_welding AS kkow")
      .select(db.raw("kkow.tgl"))
      .where(function () {
        this.whereRaw("MONTH(kkow.tgl) LIKE ?", month);
      })
      .limit(50)
      .groupByRaw("MONTH(kkow.tgl)")
      .groupByRaw("YEAR(kkow.tgl)")
      .orderBy("kkow.tgl", "desc");
    return res.json(
      results.map((r) => ({
        value: moment(r.tgl).utc(true).format("YYYY-MM"),
        label: moment(r.tgl).utc(true).format("MMMM YYYY"),
        type: "worker",
      }))
    );
  } catch (error) {
    next(error);
  }
});

export default router;
