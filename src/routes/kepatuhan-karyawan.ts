import { Router } from "express";
import initKnex from "../lib/knex-config";
import moment from "moment";
const router = Router();
const db = initKnex("stok_barang");

// get press document by date
router.get("/press/date/:tanggal", async function (req, res, next) {
  try {
    const { tanggal } = req.params;
    const query = [
      "kontrol_kepatuhan_operator.id",
      "kontrol_kepatuhan_operator.id_stok_masuk_detail",
      db.raw("IFNULL(kontrol_kepatuhan_operator.nik, 0) AS nik"),
      "kontrol_kepatuhan_operator.karyawan",
      "kontrol_kepatuhan_operator.proses",
      db.raw("IFNULL(kontrol_kepatuhan_operator.checksheet, 0) AS checksheet"),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator.verifikasi_setup, 0) AS verifikasi_setup"
      ),
      db.raw("IFNULL(kontrol_kepatuhan_operator.sensor, 0) AS sensor"),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator.kondisi_sensor, 0) AS kondisi_sensor"
      ),
      db.raw("IFNULL(kontrol_kepatuhan_operator.sop, 0) AS sop"),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator.kesesuaian_sop, 0) AS kesesuaian_sop"
      ),
      db.raw("IFNULL(kontrol_kepatuhan_operator.ear_plug, 0) AS ear_plug"),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator.sepatu_safety, 0) AS sepatu_safety"
      ),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator.ganjal_tombol, 0) AS ganjal_tombol"
      ),
      db.raw("IFNULL(kontrol_kepatuhan_operator.oli_sampah, 0) AS oli_sampah"),
      db.raw("IFNULL(kontrol_kepatuhan_operator.line_mesin, 0) AS line_mesin"),
      db.raw("IFNULL(kontrol_kepatuhan_operator.jig_proses, 0) AS jig_proses"),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator.history_card, 0) AS history_card"
      ),
      "kontrol_kepatuhan_operator.catatan",
      "kontrol_kepatuhan_operator.tgl",
      "kontrol_kepatuhan_operator.area",
      "ppc_tonase.kode_mesin AS kode_mesin",
    ];
    const date = moment(tanggal).utc(true).format();
    const results = await db
      .select(...query)
      .from("kontrol_kepatuhan_operator")
      .leftOuterJoin(
        "ppc_tonase",
        "ppc_tonase.id",
        "kontrol_kepatuhan_operator.id_mesin"
      )
      .where("kontrol_kepatuhan_operator.tgl", date)
      .whereNot("kontrol_kepatuhan_operator.karyawan", "")
      .whereNot("kontrol_kepatuhan_operator.nik", "")
      .orderBy("kontrol_kepatuhan_operator.karyawan", "asc");

    return res.json(results);
  } catch (error) {
    next(error);
  }
});
// get press document by worker
router.get("/press/worker/:worker", async function (req, res, next) {
  try {
    const { worker } = req.params;
    const query = [
      "kontrol_kepatuhan_operator.id",
      "kontrol_kepatuhan_operator.id_stok_masuk_detail",
      db.raw("IFNULL(kontrol_kepatuhan_operator.nik, 0) AS nik"),
      "kontrol_kepatuhan_operator.karyawan",
      "kontrol_kepatuhan_operator.proses",
      db.raw("IFNULL(kontrol_kepatuhan_operator.checksheet, 0) AS checksheet"),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator.verifikasi_setup, 0) AS verifikasi_setup"
      ),
      db.raw("IFNULL(kontrol_kepatuhan_operator.sensor, 0) AS sensor"),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator.kondisi_sensor, 0) AS kondisi_sensor"
      ),
      db.raw("IFNULL(kontrol_kepatuhan_operator.sop, 0) AS sop"),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator.kesesuaian_sop, 0) AS kesesuaian_sop"
      ),
      db.raw("IFNULL(kontrol_kepatuhan_operator.ear_plug, 0) AS ear_plug"),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator.sepatu_safety, 0) AS sepatu_safety"
      ),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator.ganjal_tombol, 0) AS ganjal_tombol"
      ),
      db.raw("IFNULL(kontrol_kepatuhan_operator.oli_sampah, 0) AS oli_sampah"),
      db.raw("IFNULL(kontrol_kepatuhan_operator.line_mesin, 0) AS line_mesin"),
      db.raw("IFNULL(kontrol_kepatuhan_operator.jig_proses, 0) AS jig_proses"),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator.history_card, 0) AS history_card"
      ),
      "kontrol_kepatuhan_operator.catatan",
      "kontrol_kepatuhan_operator.tgl",
      "kontrol_kepatuhan_operator.area",
      "ppc_tonase.kode_mesin AS kode_mesin",
    ];
    const results = await db
      .select(...query)
      .from("kontrol_kepatuhan_operator")
      .leftOuterJoin(
        "ppc_tonase",
        "ppc_tonase.id",
        "kontrol_kepatuhan_operator.id_mesin"
      )
      .where("kontrol_kepatuhan_operator.nik", "like", worker)
      .orWhere("kontrol_kepatuhan_operator.karyawan", "like", worker)
      .orderBy("kontrol_kepatuhan_operator.tgl", "desc");
    return res.json(results);
  } catch (error) {
    next(error);
  }
});

// get welding document by date
router.get("/welding/date/:tanggal", async function (req, res, next) {
  try {
    const { tanggal } = req.params;
    const query = [
      "kontrol_kepatuhan_operator_welding.id",
      "kontrol_kepatuhan_operator_welding.id_stok_masuk_detail",
      "kontrol_kepatuhan_operator_welding.tgl",
      "kontrol_kepatuhan_operator_welding.nik",
      "kontrol_kepatuhan_operator_welding.karyawan",
      "kontrol_kepatuhan_operator_welding.id_mesin",
      "kontrol_kepatuhan_operator_welding.proses",
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator_welding.checksheet,0) AS checksheet"
      ),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator_welding.verifikasi_setup,0) AS verifikasi_setup"
      ),
      db.raw("IFNULL(kontrol_kepatuhan_operator_welding.sop,0) AS sop"),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator_welding.topi_kerja,0) AS topi_kerja"
      ),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator_welding.sepatu_safety,0) AS sepatu_safety"
      ),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator_welding.appron_dada,0) AS appron_dada"
      ),
      db.raw("IFNULL(kontrol_kepatuhan_operator_welding.masker,0) AS masker"),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator_welding.alat_bantu_kerja,0) AS alat_bantu_kerja"
      ),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator_welding.oli_sampah,0) AS oli_sampah"
      ),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator_welding.line_mesin,0) AS line_mesin"
      ),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator_welding.jig_proses,0) AS jig_proses"
      ),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator_welding.history_card,0) AS history_card"
      ),
      "kontrol_kepatuhan_operator_welding.catatan",
      "kontrol_kepatuhan_operator_welding.area",
      "ppc_tonase.kode_mesin AS kode_mesin",
    ];
    const date = moment(tanggal).utc(true).format();
    const results = await db
      .select(...query)
      .from("kontrol_kepatuhan_operator_welding")
      .leftOuterJoin(
        "ppc_tonase",
        "ppc_tonase.id",
        "kontrol_kepatuhan_operator_welding.id_mesin"
      )
      .where("kontrol_kepatuhan_operator_welding.tgl", date)
      .whereNot("kontrol_kepatuhan_operator_welding.karyawan", "")
      .whereNot("kontrol_kepatuhan_operator_welding.nik", "")
      .orderBy("kontrol_kepatuhan_operator_welding.karyawan", "asc");
    return res.json(results);
  } catch (error) {
    next(error);
  }
});
// get welding document by worker
router.get("/welding/worker/:worker", async function (req, res, next) {
  try {
    const { worker } = req.params;
    const query = [
      "kontrol_kepatuhan_operator_welding.id",
      "kontrol_kepatuhan_operator_welding.id_stok_masuk_detail",
      "kontrol_kepatuhan_operator_welding.tgl",
      "kontrol_kepatuhan_operator_welding.nik",
      "kontrol_kepatuhan_operator_welding.karyawan",
      "kontrol_kepatuhan_operator_welding.id_mesin",
      "kontrol_kepatuhan_operator_welding.proses",
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator_welding.checksheet,0) AS checksheet"
      ),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator_welding.verifikasi_setup,0) AS verifikasi_setup"
      ),
      db.raw("IFNULL(kontrol_kepatuhan_operator_welding.sop,0) AS sop"),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator_welding.topi_kerja,0) AS topi_kerja"
      ),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator_welding.sepatu_safety,0) AS sepatu_safety"
      ),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator_welding.appron_dada,0) AS appron_dada"
      ),
      db.raw("IFNULL(kontrol_kepatuhan_operator_welding.masker,0) AS masker"),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator_welding.alat_bantu_kerja,0) AS alat_bantu_kerja"
      ),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator_welding.oli_sampah,0) AS oli_sampah"
      ),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator_welding.line_mesin,0) AS line_mesin"
      ),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator_welding.jig_proses,0) AS jig_proses"
      ),
      db.raw(
        "IFNULL(kontrol_kepatuhan_operator_welding.history_card,0) AS history_card"
      ),
      "kontrol_kepatuhan_operator_welding.catatan",
      "kontrol_kepatuhan_operator_welding.area",
      "ppc_tonase.kode_mesin AS kode_mesin",
    ];
    const results = await db
      .select(...query)
      .from("kontrol_kepatuhan_operator_welding")
      .leftOuterJoin(
        "ppc_tonase",
        "ppc_tonase.id",
        "kontrol_kepatuhan_operator_welding.id_mesin"
      )
      .where("kontrol_kepatuhan_operator_welding.nik", "like", worker)
      .orWhere("kontrol_kepatuhan_operator_welding.karyawan", "like", worker)
      .orderBy("kontrol_kepatuhan_operator_welding.tgl", "desc");
    return res.json(results);
  } catch (error) {
    next(error);
  }
});

// find press documents by date for select component
router.get("/press/select/date/:tanggal", async function (req, res, next) {
  try {
    const { tanggal } = req.params;
    const results = await db
      .select("kontrol_kepatuhan_operator.tgl")
      .distinct("kontrol_kepatuhan_operator.tgl")
      .from("kontrol_kepatuhan_operator")
      .where("kontrol_kepatuhan_operator.tgl", "LIKE", "%".concat(tanggal, "%"))
      .orderBy("kontrol_kepatuhan_operator.tgl", "desc")
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
router.get("/press/select/worker/:worker", async function (req, res, next) {
  try {
    const { worker } = req.params;
    const results = await db
      .select("kontrol_kepatuhan_operator.karyawan")
      .distinct("kontrol_kepatuhan_operator.nik")
      .from("kontrol_kepatuhan_operator")
      .where("kontrol_kepatuhan_operator.nik", "LIKE", "%".concat(worker, "%"))
      .orWhere(
        "kontrol_kepatuhan_operator.karyawan",
        "LIKE",
        "%".concat(worker, "%")
      )
      .groupBy("kontrol_kepatuhan_operator.nik")
      .orderBy("kontrol_kepatuhan_operator.karyawan", "asc")
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

// find welding documents by date for select component
router.get("/welding/select/date/:tanggal", async function (req, res, next) {
  try {
    const { tanggal } = req.params;
    const results = await db
      .select("kontrol_kepatuhan_operator_welding.tgl")
      .distinct("kontrol_kepatuhan_operator_welding.tgl")
      .from("kontrol_kepatuhan_operator_welding")
      .where(
        "kontrol_kepatuhan_operator_welding.tgl",
        "LIKE",
        "%".concat(tanggal, "%")
      )
      .orderBy("kontrol_kepatuhan_operator_welding.tgl", "desc")
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
router.get("/welding/select/worker/:worker", async function (req, res, next) {
  try {
    const { worker } = req.params;
    const results = await db
      .select("kontrol_kepatuhan_operator_welding.karyawan")
      .distinct("kontrol_kepatuhan_operator_welding.nik")
      .from("kontrol_kepatuhan_operator_welding")
      .where(
        "kontrol_kepatuhan_operator_welding.nik",
        "LIKE",
        "%".concat(worker, "%")
      )
      .orWhere(
        "kontrol_kepatuhan_operator_welding.karyawan",
        "LIKE",
        "%".concat(worker, "%")
      )
      .groupBy("kontrol_kepatuhan_operator_welding.nik")
      .orderBy("kontrol_kepatuhan_operator_welding.karyawan", "asc")
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

export default router;
