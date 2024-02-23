import bcrypt from "bcrypt";
import { Router } from "express";
import jwt from "jsonwebtoken";
import moment from "moment";
import initKnex from "../lib/knex-config";
import { ILoginForm, IMarketingUser, ISignUpFormMarketing } from "../lib/types";
import { hasAllProperties, verifyAuthorization } from "../lib/utils";

const router = Router();
const dbpr = initKnex("m-payroll");
const dbsb = initKnex("stok_barang");
const SALT = 10;
const SECRET_KEY = process.env.SECRET_KEY_APP as string;
const SUPERUSER_ACC = process.env.SUPERUSER_ACCOUNT as string;
const SUPERUSER_ID = process.env.SUPERUSER_ID as string;
const EXPIRES_HOUR = "5h";

// ! SELECT ENDPOINT ✅
router.get("/find/worker", async function (req, res, next) {
  try {
    verifyAuthorization(req);
    const keyword: string = (req.query.keyword as string) || "";
    const limit: number = Number(req.query.limit as string) || 20;
    const query = [
      "dkr.nik",
      "dkr.nm_depan_karyawan AS karyawan",
      "dkr.departemen",
    ];
    const allowedDepartement = ["Finance", "IT", "Marketing"];
    const result = await dbpr("data_karyawan AS dkr")
      .select(...query)
      .distinct("dkr.nik")
      .joinRaw(
        "LEFT OUTER JOIN `stok_barang`.marketing_users AS users ON users.nik = dkr.nik"
      )
      .whereNull("users.nik")
      .where(function () {
        this.where("dkr.nik", "LIKE", `%${keyword}%`).orWhere(
          "dkr.nm_depan_karyawan",
          "LIKE",
          `%${keyword}%`
        );
      })
      .whereIn("dkr.departemen", allowedDepartement)
      .limit(limit)
      .orderBy(["dkr.departemen", "dkr.nm_depan_karyawan"]);
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

// ✅✅
router.get("/find/purchase-order", async function (req, res, next) {
  try {
    verifyAuthorization(req);
    let keyword = req.query?.keyword as string;
    if (!keyword) keyword = "";
    const query = [
      dbsb.raw("MONTH(ipp.tgl_pesanan) AS bulan"),
      dbsb.raw("YEAR(ipp.tgl_pesanan) AS tahun"),
      "ipp.kode_barang",
      "ipp.nama_barang",
      dbsb.raw("SUM(ipp.qty) AS qty"),
      "ipp.customer",
      "ipp.id",
      "ipp.tgl_pesanan",
    ];

    const results = await dbsb("im_pesanan_produk AS ipp")
      .select(...query)
      .limit(50)
      .whereNot("ipp.harga", 0)
      .where(function () {
        this.where("ipp.customer", "LIKE", `%${keyword}%`)
          .orWhere("ipp.kode_barang", "LIKE", `%${keyword}%`)
          .orWhere("ipp.nama_barang", "LIKE", `%${keyword}%`)
          .orWhere("ipp.id", "LIKE", `%${keyword}%`);
      })
      .groupByRaw("MONTH(ipp.tgl_pesanan)")
      .groupByRaw("YEAR(ipp.tgl_pesanan)")
      .groupBy("ipp.kode_barang")
      .groupBy("ipp.nama_barang")
      .groupBy("ipp.customer")
      .groupBy("ipp.harga")
      .orderBy("ipp.customer", "asc")
      .orderBy("ipp.tgl_pesanan", "desc");

    return res.json(results);
  } catch (error) {
    next(error);
  }
});

router.get("/find/users", async function (req, res, next) {
  try {
    verifyAuthorization(req);
    let keyword = req.query.keyword as string;
    if (!keyword) keyword = "";
    const query = ["mu.username", "mu.nik", "mu.id", "mu.roles"];
    const data = await dbsb("marketing_users AS mu")
      .select(...query)
      .where("mu.nik", "like", `%${keyword}%`)
      .orWhere("mu.username", "like", `%${keyword}%`);
    return res.json(data);
  } catch (error) {
    next(error);
  }
});

// ! AUTH ENDPOINT ✅
router.post("/auth/login", async function (req, res, next) {
  try {
    const { username, password } = req.body as ILoginForm;
    const query = [
      "mu.id",
      "mu.nik",
      "mu.username",
      "mu.password",
      "mu.roles",
      "mu.created_at",
      "mu.updated_at",
      "kry.nm_depan_karyawan AS nama",
      dbsb.raw("NULLIF(kry.departemen,'0') AS departemen"),
    ];
    const isUserValid = (await dbsb("marketing_users AS mu")
      .select(...query)
      .first()
      .joinRaw("JOIN `m-payroll`.data_karyawan AS kry ON mu.nik = kry.nik")
      .where("mu.username", username)) as IMarketingUser;
    if (!isUserValid) throw new Error("User is invalid");
    const isPasswordValid = bcrypt.compareSync(password, isUserValid.password);
    if (!isPasswordValid) throw new Error("Password is invalid");
    const token = jwt.sign({ ...isUserValid }, <string>SECRET_KEY, {
      expiresIn: EXPIRES_HOUR,
    });
    return res.json({ token });
  } catch (error) {
    next(error);
  }
});

router.get("/auth/verify", async function (req, res, next) {
  try {
    const user = verifyAuthorization(req);
    if (user?.password) delete user.password;
    return res.json(user);
  } catch (error) {
    next(error);
  }
});

// ! USER ENDPOINT ✅
router.get("/users", async function (req, res, next) {
  try {
    const user = verifyAuthorization(req);
    if (user.roles !== "ADMIN") throw new Error("User roles is invalid");
    const limit = Number(<string>req.query?.limit) || 9999;
    const offset = Number(<string>req.query?.offset) || 0;
    const query = [
      "mu.id",
      "mu.nik AS nik",
      "mu.username",
      "mu.roles",
      dbsb.raw(
        "IF(kry.departemen='0','Lainnya', kry.departemen) AS departemen"
      ),
      "kry.nm_depan_karyawan AS nama",
    ];
    const result = (await dbsb("marketing_users AS mu")
      .select(...query)
      .limit(limit, { skipBinding: true })
      .offset(offset * limit, { skipBinding: true })
      .joinRaw(
        "LEFT JOIN `m-payroll`.data_karyawan AS kry ON kry.nik = mu.nik"
      )) as Partial<IMarketingUser[]>;
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

// ✅
router.get("/users/:nik", async function (req, res, next) {
  try {
    verifyAuthorization(req);
    const { nik } = req.params;
    const query = [
      "mu.id",
      "mu.nik AS nik",
      "mu.username",
      "mu.roles",
      dbsb.raw("IF(kry.departemen='0','Lainnya',kry.departemen) AS departemen"),
      "kry.nm_depan_karyawan AS nama",
    ];
    const result = await dbsb("marketing_users AS mu")
      .select(...query)
      .first()
      .joinRaw("LEFT JOIN `m-payroll`.data_karyawan AS kry ON kry.nik = mu.nik")
      .where("mu.nik", nik);
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

// ✅
router.post("/users/signup", async function (req, res, next) {
  try {
    const body = req.body as ISignUpFormMarketing;
    const requiredProperties: (keyof ISignUpFormMarketing)[] = [
      "nik",
      "password",
      "roles",
      "username",
    ];

    if (!hasAllProperties(body, requiredProperties))
      throw new Error("Required field is undefined");
    const isNikValid = await dbpr("data_karyawan AS dkr")
      .first()
      .where("dkr.nik", body.nik);
    if (!isNikValid) throw new Error("NIK is invalid");
    const encryptedPassword = bcrypt.hashSync(body.password, SALT);
    const data: ISignUpFormMarketing = {
      ...body,
      password: encryptedPassword,
    };
    const result = await dbsb("marketing_users").insert(data);
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

router.put("/users/update", async function (req, res, next) {
  try {
    const user = verifyAuthorization(req);
    const body = req.body as Partial<IMarketingUser>;
    // ? username author cannot be changed
    if (body?.nik === SUPERUSER_ID) body.username = SUPERUSER_ACC;
    // ? user cannot modify other than his/her account
    if (user.roles === "USER") throw new Error("Invalid roles");
    if (body.password) body.password = bcrypt.hashSync(body.password, SALT);
    const result = await dbsb("marketing_users")
      .update(body)
      .where("nik", body.nik);
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

router.delete("/users/delete/:nik", async function (req, res, next) {
  try {
    const user = verifyAuthorization(req);
    const { nik } = req.params;
    if (user.roles !== "ADMIN") throw new Error("Invalid roles");
    if (user.nik === nik) throw new Error("User cannot delete itself");
    const isDeletedUserValid = (await dbsb("marketing_users")
      .where({ nik })
      .first()) as IMarketingUser;
    if (!isDeletedUserValid) throw new Error("Selected user is invalid");
    if (isDeletedUserValid.roles === "ADMIN" && user?.nik !== SUPERUSER_ID)
      throw new Error("Selected user is ADMIN that cannot be deleted");
    if (nik === SUPERUSER_ID || isDeletedUserValid?.username === SUPERUSER_ACC)
      throw new Error("Author cannot be deleted");
    const result = await dbsb("marketing_users").where({ nik }).delete();
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

// ! PURCHASE ORDER ENDPOINT
// ✅✅
router.get("/purchase-order", async function (req, res, next) {
  try {
    verifyAuthorization(req);
    const { induk, month, year, customer } = req.query;
    Object.entries({ induk, month, year, customer }).forEach(([key, value]) => {
      if (!value) throw new Error(key.concat(" is required"));
    });
    const query = [
      "ipp.id",
      dbsb.raw("MONTH(ipp.tgl_pesanan) AS bulan"),
      dbsb.raw("YEAR(ipp.tgl_pesanan) AS tahun"),
      "ipp.tgl_pesanan",
      "ipp.customer",
      "ipp.kode_barang",
      "ipp.nama_barang",
      "ipp.satuan",
      dbsb.raw("SUM(ipp.qty) AS qty"),
      dbsb.raw("MAX(ipp.harga) AS harga"),
      dbsb.raw("IFNULL(SUM(ipp.qty) * MAX(ipp.harga),0) AS total"),
    ];
    const results = await dbsb("im_pesanan_produk AS ipp")
      .select(...query)
      .first()
      .whereNot("ipp.harga", 0)
      .where(function () {
        this.where("ipp.kode_barang", induk)
          .andWhere("ipp.customer", customer)
          .andWhereRaw("MONTH(ipp.tgl_pesanan) = ?", month)
          .andWhereRaw("YEAR(ipp.tgl_pesanan) = ?", year);
      })
      .groupByRaw("MONTH(ipp.tgl_pesanan)")
      .groupByRaw("YEAR(ipp.tgl_pesanan)")
      .groupBy("ipp.customer")
      .groupBy("ipp.kode_barang")
      .groupBy("ipp.nama_barang")
      .groupBy("ipp.harga")
      .orderBy("ipp.tgl_pesanan", "desc");
    return res.json(results);
  } catch (error) {
    next(error);
  }
});

// ! COST CALCULATION PROCESS ENDPOINT
// ✅
router.get("/cost-process", async function (req, res, next) {
  try {
    try {
      verifyAuthorization(req);
      let { month, year, induk, customer } = req.query;
      if (!induk) throw new Error("ID is required");
      if (!month || !year) throw new Error("Month or Year are required");
      if (!customer) throw new Error("Customer is required");

      const query = [
        "pc.bulan",
        "pc.tahun",
        "bal1.induk",
        "bal1.jenis_barang",
        "bal1.kode_barang",
        "bal1.proses",
        "bal1.satuan",
        "bal1.mesin",
        "pc.qty",
        dbsb.raw(
          "IFNULL(bal1.cycletime, IFNULL(bal1.cytime_weld, 0)) AS cytime"
        ),
        "bal1.trf_msn",
        dbsb.raw("IFNULL(bal1.cvt, 0) AS cvt"),
        dbsb.raw(
          "IFNULL(pc.qty * IFNULL(bal1.cycletime, IFNULL(bal1.cytime_weld, 0)) * bal1.trf_msn / bal1.cvt, 0) AS hrg_internal"
        ),
        dbsb.raw("IFNULL(bal1.hrg_outplan, 0) AS hrg_outplan"),
        dbsb.raw(
          "IFNULL(IFNULL(pc.qty * IFNULL(bal1.cycletime, IFNULL(bal1.cytime_weld, 0)) * bal1.trf_msn / bal1.cvt, 0), IFNULL(bal1.hrg_outplan, 0)) AS hrg_proses"
        ),
        "bal1.maker",
      ];

      const results = await dbsb("pesanan_customer AS pc")
        .select(...query)
        .join("bom_all_level_1 AS bal1", "bal1.induk", "pc.induk")
        .whereNot("pc.harga", 0)
        .where(function () {
          this.where("pc.induk", induk)
            .where("pc.bulan", month)
            .andWhere("pc.tahun", year)
            .andWhere("pc.customer", customer);
        })
        .where(function () {
          this.where("bal1.jenis_barang", "LIKE", "%WIP%").andWhere(
            "bal1.proses",
            "NOT LIKE",
            "%FINISH GOOD%"
          );
        });
      return res.json(results);
    } catch (error) {
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

// ! COST MATERIAL ENDPOINT ✅
router.get("/cost-material", async function (req, res, next) {
  try {
    verifyAuthorization(req);
    let { month, year, induk, customer } = req.query;
    if (!induk) throw new Error("ID is required");
    if (!month || !year) throw new Error("Month or Year are required");
    if (!customer) throw new Error("Customer is required");
    const query = [
      "pc.bulan",
      "pc.tahun",
      "bal1.induk",
      "bal1.jenis_barang",
      "bal1.kode_barang",
      "bal1.nama_barang",
      "bal1.satuan",
      "pc.qty",
      "bal1.bruto",
      dbsb.raw("1 / bal1.bruto AS material_pcs"),
      dbsb.raw("ROUND(pc.qty * bal1.bruto, 2) AS total_kebutuhan"),
      dbsb.raw("IFNULL(bal1.hrg_outplan, 0) AS harga"),
      dbsb.raw(
        "ROUND(IFNULL(bal1.hrg_outplan / (1 / bal1.bruto), 0), 2) AS harga_pcs"
      ),
      dbsb.raw(
        "ROUND(pc.qty * bal1.bruto, 2) * IFNULL(bal1.hrg_outplan / (1 / bal1.bruto), 0) AS total_cost_butuh"
      ),
      dbsb.raw(
        "ROUND(pc.qty * IFNULL(bal1.hrg_outplan / (1 / bal1.bruto), 0), 0) AS total_cost"
      ),
      "bal1.spesifikasi",
    ];

    const results = await dbsb("pesanan_customer AS pc")
      .select(...query)
      .join("bom_all_level_1 AS bal1", "bal1.induk", "pc.induk")
      .whereNot("pc.harga", 0)
      .where(function () {
        this.where("pc.induk", induk)
          .andWhere("pc.customer", customer)
          .andWhere("pc.bulan", month)
          .andWhere("pc.tahun", year);
      })
      .where("bal1.jenis_barang", "LIKE", "%Raw Material%");
    return res.json(results);
  } catch (error) {
    next(error);
  }
});

// ! LOGS USER
router.get("/logs", async function (req, res, next) {
  try {
    const user = verifyAuthorization(req);

    if (user.roles !== "ADMIN") throw new Error("User roles is invalid");

    let limit = (req.query.limit || "100") as string;
    let offset = (req.query.offset || "0") as string;
    let start = req.query.start as string;
    let end = req.query.end as string;

    // default start date
    if (!start) start = moment().startOf("day").utc(true).format();
    else start = moment(start).startOf("day").utc(true).format();
    // default end date
    if (!end) end = moment().endOf("day").utc(true).format();
    else end = moment(end).endOf("day").utc(true).format();

    const data = await dbsb("marketing_users_log AS mul")
      .select("*")
      .where(function () {
        this.whereBetween("created_at", [start, end]);
      })
      .limit(Number(limit))
      .offset(Number(offset) * Number(limit))
      .orderBy("mul.created_at", "desc");

    return res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/logs/count", async function (req, res, next) {
  try {
    verifyAuthorization(req);
    const username = (req.query.username as string) || "";

    const query = [dbsb.raw("COUNT(mul.username) AS total"), "mul.username"];
    const result = await dbsb("marketing_users_log AS mul")
      .select(...query)
      .where(function () {
        if (username) this.where("mul.username", username);
      })
      .orderBy("mul.created_at", "desc")
      .groupBy("mul.username");
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/logs/:username", async function (req, res, next) {
  try {
    const user = verifyAuthorization(req);
    const username = req.params.username as string;
    let start = req.query.start as string;
    let end = req.query.end as string;
    let offset = (req.query.offset as string) || "0";
    let range = (req.query.range as string) || "10";
    if (user.username !== username) throw new Error("Username is not match");
    // default start date
    if (!start) start = moment().startOf("day").utc(true).format();
    else start = moment(start).startOf("day").utc(true).format();
    // default end date
    if (!end) end = moment().endOf("day").utc(true).format();
    else end = moment(end).endOf("day").utc(true).format();

    const data = await dbsb("marketing_users_log AS mul")
      .select("*")
      .where("mul.username", username)
      .where(function () {
        this.whereBetween("created_at", [start, end]);
      })
      .limit(Number(range))
      .offset(Number(offset) * Number(range))
      .orderBy("mul.created_at", "desc");
    return res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post("/logs", async function (req, res, next) {
  try {
    const body = req.body as {
      log: string;
      username: string | null;
      ip_address: string;
    };
    if (!body.log) throw new Error("Log cannot be empty");
    const isUserValid = await dbsb("marketing_users AS mu")
      .select("*")
      .where("mu.username", body.username)
      .first();
    if (!isUserValid) body.username = null;
    const data = await dbsb("marketing_users_log").insert({
      ...body,
      log: body.log.toLowerCase(),
    });

    return res.json(data);
  } catch (error) {
    next(error);
  }
});

router.delete("/logs/:log_id", async function (req, res, next) {
  try {
    const user = verifyAuthorization(req);
    if (user.roles !== "ADMIN") throw new Error("Invalid roles");
    const logId = req.params.log_id;
    const id: number = Number(logId);
    if (!id) throw new Error("Invalid Log ID");
    const data = await dbsb("marketing_users_log").where("id", id).delete();
    return res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
