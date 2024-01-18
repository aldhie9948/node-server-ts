import { Router } from "express";
import initKnex from "../lib/knex-config";
import moment from "moment";
const router = Router();
const db = initKnex("stok_barang");

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
    ];
    const date = moment(tanggal).utc(true).format();
    const results = await db
      .select(...query)
      .from("kontrol_kepatuhan_operator")
      .where("kontrol_kepatuhan_operator.tgl", date)
      .orderBy("kontrol_kepatuhan_operator.karyawan", "asc");

    return res.json(results);
  } catch (error) {
    next(error);
  }
});
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
    ];
    const results = await db
      .select(...query)
      .from("kontrol_kepatuhan_operator")
      .where("kontrol_kepatuhan_operator.nik", "like", worker)
      .orWhere("kontrol_kepatuhan_operator.karyawan", "like", worker)
      .orderBy("kontrol_kepatuhan_operator.tgl", "desc");
    return res.json(results);
  } catch (error) {
    next(error);
  }
});

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

export default router;
