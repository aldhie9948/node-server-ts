import { Router } from "express";
import initKnex from "../lib/knex-config";
import moment from "moment";
const router = Router();
const db = initKnex("stok_barang");

// monitoring press
router.get("/press", async function (_req, res, next) {
  try {
    // Get the current time
    const currentTime = moment();

    // Define shift start times
    const shift1Start = moment("07:30", "HH:mm");
    const shift2Start = moment("15:30", "HH:mm");
    const shift3Start = moment("23:30", "HH:mm");

    let codeShift: "01" | "02" | "03";

    // Determine the current shift based on the current time
    if (currentTime.isBetween(shift1Start, shift2Start.subtract(1, "second"))) {
      codeShift = "01";
    } else if (
      currentTime.isBetween(shift2Start, shift3Start.subtract(1, "second"))
    ) {
      codeShift = "02";
    } else {
      codeShift = "03";
    }
    let daySubtractor =
      codeShift === "03" && currentTime.format("HH:mm") !== "00:00" ? -1 : 0;
    const query = [
      "hasil_produksi.tgl_dokumen",
      "hasil_produksi.no_rencana",
      "hasil_produksi.shift",
      "hasil_produksi.operator",
      "hasil_produksi.kode_mesin",
      "hasil_produksi.barang",
      "hasil_produksi.satuan",
      "plan_produksi.qty AS plan",
      db.raw(
        "IF(ifnull(hasil_produksi.01,0) = 0, '', ROUND((plan_produksi.qty / plan_produksi.plan_time), 0)) AS plan_01"
      ),
      "hasil_produksi.01 AS 01",
      db.raw(
        "ROUND(hasil_produksi.01 / ROUND((plan_produksi.qty / plan_produksi.plan_time),0), 2) AS persen_01"
      ),
      "hasil_produksi.ket_j1",
      db.raw(
        "IF(IFNULL(hasil_produksi.02,0) = 0, '', ROUND((plan_produksi.qty / plan_produksi.plan_time), 0)) AS plan_02"
      ),
      db.raw(
        "IF(hasil_produksi.02 = 0, '', hasil_produksi.02 - hasil_produksi.01) AS `02`"
      ),
      db.raw(
        "ROUND(IF(hasil_produksi.02 = 0, '', hasil_produksi.02 - hasil_produksi.01) / ROUND((plan_produksi.qty / plan_produksi.plan_time), 0), 2) AS persen_02"
      ),
      "hasil_produksi.ket_j2",
      db.raw(
        "IF(IFNULL(hasil_produksi.01,0) = 0, '', ROUND((plan_produksi.qty / plan_produksi.plan_time), 0)) AS plan_03"
      ),
      db.raw(
        "IF(hasil_produksi.03 = 0, '', hasil_produksi.03 - hasil_produksi.02) AS `03`"
      ),
      db.raw(
        "ROUND(IF(hasil_produksi.03 = 0, '', hasil_produksi.03 - hasil_produksi.02) / ROUND((plan_produksi.qty / plan_produksi.plan_time), 0), 2) AS persen_03"
      ),
      "hasil_produksi.ket_j3",
      db.raw(
        "IF(IFNULL(hasil_produksi.04,0) = 0, '', ROUND((plan_produksi.qty / plan_produksi.plan_time), 0)) AS plan_04"
      ),
      db.raw(
        "IF(hasil_produksi.04= 0, '', hasil_produksi.04 - hasil_produksi.03) AS `04`"
      ),
      db.raw(
        "ROUND(IF(hasil_produksi.04= 0, '', hasil_produksi.04 - hasil_produksi.03) / ROUND((plan_produksi.qty / plan_produksi.plan_time), 0), 2) AS persen_04"
      ),
      "hasil_produksi.ket_j4",
      db.raw(
        "IF(IFNULL(hasil_produksi.05,0) = 0, '', ROUND((plan_produksi.qty / plan_produksi.plan_time), 0)) AS plan_05"
      ),
      db.raw(
        "IF(hasil_produksi.05 = 0, '', hasil_produksi.05 - hasil_produksi.04) AS `05`"
      ),
      db.raw(
        "ROUND(IF(hasil_produksi.05 = 0, '', hasil_produksi.05 - hasil_produksi.04) / ROUND((plan_produksi.qty / plan_produksi.plan_time), 0), 2) AS persen_05"
      ),
      "hasil_produksi.ket_j5",
      db.raw(
        "IF(IFNULL(hasil_produksi.06,0) = 0, '', ROUND((plan_produksi.qty / plan_produksi.plan_time), 0)) AS plan_06"
      ),
      db.raw(
        "IF(hasil_produksi.06 = 0, '', hasil_produksi.06 - hasil_produksi.05) AS `06`"
      ),
      db.raw(
        "ROUND(IF(hasil_produksi.06 = 0, '', hasil_produksi.06 - hasil_produksi.05) / ROUND((plan_produksi.qty / plan_produksi.plan_time), 0), 2) AS persen_06"
      ),
      "hasil_produksi.ket_j6",
      db.raw(
        "IF(IFNULL(hasil_produksi.07,0) = 0, '', ROUND((plan_produksi.qty / plan_produksi.plan_time), 0)) AS plan_07"
      ),
      db.raw(
        "IF(hasil_produksi.07 = 0, '', hasil_produksi.07 - hasil_produksi.06) AS `07`"
      ),
      db.raw(
        "ROUND(IF(hasil_produksi.07 = 0, '',hasil_produksi.07 - hasil_produksi.06) / ROUND((plan_produksi.qty / plan_produksi.plan_time), 0), 2) AS persen_07"
      ),
      "hasil_produksi.ket_j7",
      db.raw(
        "IFNULL(hasil_produksi.01,0) + IF(hasil_produksi.02 = 0, 0, IF(hasil_produksi.02 = 0, 0, IFNULL((hasil_produksi.02 - hasil_produksi.01),0))) + IF(hasil_produksi.03 = 0, 0, IFNULL(hasil_produksi.03 - hasil_produksi.02,0)) + IF(hasil_produksi.04 = 0, 0, IFNULL(hasil_produksi.04 - hasil_produksi.03,0)) + IF(hasil_produksi.05 = 0, 0, IFNULL(hasil_produksi.05 - hasil_produksi.04,0)) + IF(hasil_produksi.06 = 0, 0, IFNULL(hasil_produksi.06 - hasil_produksi.05,0)) + IF(hasil_produksi.07 = 0, 0, IFNULL(hasil_produksi.07 - hasil_produksi.06,0)) AS aktual"
      ),
      "hasil_produksi.reject",
      "hasil_produksi.bagian",
      db.raw(
        "CONCAT(IFNULL(karyawan.nm_depan_karyawan,''),' ',IFNULL(karyawan.nm_belakang_karyawan,'')) AS nama_operator"
      ),
    ];
    const result = await db
      .select(...query)
      .from("hasil_produksi")
      .leftOuterJoin("plan_produksi", function () {
        this.on("hasil_produksi.no_rencana", "plan_produksi.plan_no").andOn(
          "hasil_produksi.barang",
          "plan_produksi.id_barang"
        );
      })
      .joinRaw(
        "LEFT JOIN `m-payroll`.data_karyawan AS karyawan ON hasil_produksi.operator = karyawan.nik"
      )

      .where(function () {
        this.where(
          "hasil_produksi.tgl_dokumen",
          currentTime.add(daySubtractor, "day").format("YYYY-MM-DD")
        )
          .where("hasil_produksi.bagian", "like", "%02%")
          .where("hasil_produksi.shift", codeShift);
      })

      .orderBy("hasil_produksi.kode_mesin", "desc");
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

// monitoring welding
router.get("/welding", async function (_req, res, next) {
  try {
    const query = [
      "hasil_produksi.tgl_dokumen",
      "hasil_produksi.no_rencana",
      "hasil_produksi.shift",
      "hasil_produksi.operator",
      "hasil_produksi.kode_mesin",
      "hasil_produksi.barang",
      "hasil_produksi.satuan",
      "plan_produksi.qty AS plan",
      db.raw(
        "IF(ifnull(hasil_produksi.01,0) = 0, '', ROUND((plan_produksi.qty / plan_produksi.plan_time), 0)) AS plan_01"
      ),
      "hasil_produksi.01 AS 01",
      db.raw(
        "ROUND(hasil_produksi.01 / ROUND((plan_produksi.qty / plan_produksi.plan_time),0), 2) AS persen_01"
      ),
      "hasil_produksi.ket_j1",
      db.raw(
        "IF(IFNULL(hasil_produksi.02,0) = 0, '', ROUND((plan_produksi.qty / plan_produksi.plan_time), 0)) AS plan_02"
      ),
      db.raw(
        "IF(hasil_produksi.02 = 0, '', hasil_produksi.02 - hasil_produksi.01) AS `02`"
      ),
      db.raw(
        "ROUND(IF(hasil_produksi.02 = 0, '', hasil_produksi.02 - hasil_produksi.01) / ROUND((plan_produksi.qty / plan_produksi.plan_time), 0), 2) AS persen_02"
      ),
      "hasil_produksi.ket_j2",
      db.raw(
        "IF(IFNULL(hasil_produksi.01,0) = 0, '', ROUND((plan_produksi.qty / plan_produksi.plan_time), 0)) AS plan_03"
      ),
      db.raw(
        "IF(hasil_produksi.03 = 0, '', hasil_produksi.03 - hasil_produksi.02) AS `03`"
      ),
      db.raw(
        "ROUND(IF(hasil_produksi.03 = 0, '', hasil_produksi.03 - hasil_produksi.02) / ROUND((plan_produksi.qty / plan_produksi.plan_time), 0), 2) AS persen_03"
      ),
      "hasil_produksi.ket_j3",
      db.raw(
        "IF(IFNULL(hasil_produksi.04,0) = 0, '', ROUND((plan_produksi.qty / plan_produksi.plan_time), 0)) AS plan_04"
      ),
      db.raw(
        "IF(hasil_produksi.04= 0, '', hasil_produksi.04 - hasil_produksi.03) AS `04`"
      ),
      db.raw(
        "ROUND(IF(hasil_produksi.04= 0, '', hasil_produksi.04 - hasil_produksi.03) / ROUND((plan_produksi.qty / plan_produksi.plan_time), 0), 2) AS persen_04"
      ),
      "hasil_produksi.ket_j4",
      db.raw(
        "IF(IFNULL(hasil_produksi.05,0) = 0, '', ROUND((plan_produksi.qty / plan_produksi.plan_time), 0)) AS plan_05"
      ),
      db.raw(
        "IF(hasil_produksi.05 = 0, '', hasil_produksi.05 - hasil_produksi.04) AS `05`"
      ),
      db.raw(
        "ROUND(IF(hasil_produksi.05 = 0, '', hasil_produksi.05 - hasil_produksi.04) / ROUND((plan_produksi.qty / plan_produksi.plan_time), 0), 2) AS persen_05"
      ),
      "hasil_produksi.ket_j5",
      db.raw(
        "IF(IFNULL(hasil_produksi.06,0) = 0, '', ROUND((plan_produksi.qty / plan_produksi.plan_time), 0)) AS plan_06"
      ),
      db.raw(
        "IF(hasil_produksi.06 = 0, '', hasil_produksi.06 - hasil_produksi.05) AS `06`"
      ),
      db.raw(
        "ROUND(IF(hasil_produksi.06 = 0, '', hasil_produksi.06 - hasil_produksi.05) / ROUND((plan_produksi.qty / plan_produksi.plan_time), 0), 2) AS persen_06"
      ),
      "hasil_produksi.ket_j6",
      db.raw(
        "IF(IFNULL(hasil_produksi.07,0) = 0, '', ROUND((plan_produksi.qty / plan_produksi.plan_time), 0)) AS plan_07"
      ),
      db.raw(
        "IF(hasil_produksi.07 = 0, '', hasil_produksi.07 - hasil_produksi.06) AS `07`"
      ),
      db.raw(
        "ROUND(IF(hasil_produksi.07 = 0, '',hasil_produksi.07 - hasil_produksi.06) / ROUND((plan_produksi.qty / plan_produksi.plan_time), 0), 2) AS persen_07"
      ),
      "hasil_produksi.ket_j7",
      db.raw(
        "IFNULL(hasil_produksi.01,0) + IF(hasil_produksi.02 = 0, 0, IF(hasil_produksi.02 = 0, 0, IFNULL((hasil_produksi.02 - hasil_produksi.01),0))) + IF(hasil_produksi.03 = 0, 0, IFNULL(hasil_produksi.03 - hasil_produksi.02,0)) + IF(hasil_produksi.04 = 0, 0, IFNULL(hasil_produksi.04 - hasil_produksi.03,0)) + IF(hasil_produksi.05 = 0, 0, IFNULL(hasil_produksi.05 - hasil_produksi.04,0)) + IF(hasil_produksi.06 = 0, 0, IFNULL(hasil_produksi.06 - hasil_produksi.05,0)) + IF(hasil_produksi.07 = 0, 0, IFNULL(hasil_produksi.07 - hasil_produksi.06,0)) AS aktual"
      ),
      "hasil_produksi.reject",
      "hasil_produksi.bagian",
      db.raw(
        "CONCAT(IFNULL(karyawan.nm_depan_karyawan,''),' ',IFNULL(karyawan.nm_belakang_karyawan,'')) AS nama_operator"
      ),
    ];
    const currentDate = new Date().toISOString().split("T")[0];
    const result = await db
      .select(...query)
      .from("hasil_produksi")
      .leftOuterJoin("plan_produksi", function () {
        this.on("hasil_produksi.no_rencana", "plan_produksi.plan_no").andOn(
          "hasil_produksi.barang",
          "plan_produksi.id_barang"
        );
      })
      .joinRaw(
        "LEFT JOIN `m-payroll`.data_karyawan AS karyawan ON hasil_produksi.operator = karyawan.nik"
      )
      .where("hasil_produksi.tgl_dokumen", currentDate)
      .andWhereNot("hasil_produksi.bagian", "LIKE", "%02%")
      .andWhereNot("hasil_produksi.bagian", "LIKE", "%T%")
      .groupBy("barang")
      .groupBy("operator")
      .orderBy("hasil_produksi.kode_mesin", "desc");
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
