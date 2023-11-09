import { Router } from "express";
import initKnex from "../lib/knex-config";
const router = Router();
const db = initKnex("stok_barang");

router.get("/:plan_no", async function (req, res, next) {
  try {
    let { plan_no } = req.params;
    const data = await db
      .distinct("plan_no")
      .from("im_plan_detail")
      .where("plan_no", "like", `%${plan_no}%`)
      .limit(200)
      .orderBy("plan_no", "asc");
    return res.json(
      await Promise.all(
        data.map(async (item) => {
          const plan = <string[]>item.plan_no.split("-");
          const codeArea = /T/g.test(item.plan_no.toUpperCase())
            ? "T".concat(plan[1].replace("0", ""))
            : plan[1];
          const area = await db
            .select("nama_area")
            .first()
            .from("im_area")
            .where("kode_area", codeArea);
          return {
            value: item.plan_no.toUpperCase(),
            label: "Plan No. ".concat(item.plan_no),
            group: area?.nama_area || "OTHER",
          };
        })
      )
    );
  } catch (error) {
    next(error);
  }
});

router.get("/detail/:plan_no", async function (req, res, next) {
  try {
    const { plan_no } = req.params;
    const data = await db
      .select(
        "im_plan_detail.id",
        "im_plan_detail.plan_no",
        "im_plan_detail.id_barang",
        "im_plan_detail.plan_time",
        "im_plan_detail.plan_qty",
        "im_plan_detail.mulai",
        "im_plan_detail.selesai",
        "im_plan_detail.keterangan",
        "im_plan_detail.mesin",
        "tbl_barang.nama_barang"
      )
      .from("im_plan_detail")
      .leftOuterJoin(
        "tbl_barang",
        "im_plan_detail.id_barang",
        "tbl_barang.kode_barang"
      )
      .where("im_plan_detail.plan_no", plan_no)
      .orderBy("im_plan_detail.plan_no", "asc");
    return res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/plan/:plan_no", async function (req, res, next) {
  try {
    const { plan_no } = req.params;
    const plan = plan_no.split("-");
    const codeArea = /T/g.test(plan_no.toUpperCase())
      ? "T".concat(plan[1].replace("0", ""))
      : plan[1];
    const area = await db
      .select("nama_area")
      .from("im_area")
      .first()
      .where("kode_area", codeArea);
    const detail = await db
      .select("*")
      .from("im_plan_detail")
      .first()
      .where("plan_no", plan_no);
    return res.json({
      shift: plan[0].replace(/[a-zA-Z]/gi, ""),
      bagian: area?.nama_area,
      start: detail?.mulai,
      end: detail?.selesai,
      plan_no,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
