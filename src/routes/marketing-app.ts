import bcrypt from "bcrypt";
import { Router } from "express";
import jwt from "jsonwebtoken";
import moment from "moment";
import initKnex from "../lib/knex-config";
import { ILoginForm, IMarketingUser, ISignUpFormMarketing } from "../lib/types";
import { hasAllProperties, verifyAuthorization } from "../lib/utils";

const router = Router();
const dbPayroll = initKnex("m-payroll");
const dbStokBarang = initKnex("stok_barang");
const SALT = 10;
const secret_key = process.env.SECRET_KEY_APP;

// ! SELECT ENDPOINT
router.get("/find/worker/:text", async function (req, res, next) {
  try {
    const { text } = req.params;
    const query = [
      "data_karyawan.nik",
      "data_karyawan.nm_depan_karyawan AS karyawan",
      "data_karyawan.departemen",
    ];
    const allowedDepartement = ["Finance", "IT", "Marketing"];
    const result = await dbPayroll("data_karyawan")
      .select(...query)
      .distinct("data_karyawan.nik")
      .where(function () {
        this.where("data_karyawan.nik", "LIKE", `%${text}%`).orWhere(
          "data_karyawan.nm_depan_karyawan",
          "LIKE",
          `%${text}%`
        );
      })
      .whereIn("data_karyawan.departemen", allowedDepartement)
      .orderBy("data_karyawan.departemen");
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/find/purchase-order/:text", async function (req, res, next) {
  try {
    const user = verifyAuthorization(req);
    const text = req.params.text;
    const query = [
      "im_pesanan_produk.customer",
      "im_pesanan_produk.kode_barang",
      "im_pesanan_produk.nama_barang",
      "im_pesanan_produk.satuan",
      dbStokBarang.raw("MONTH(im_pesanan_produk.tgl_pesanan) AS bulan"),
      dbStokBarang.raw("YEAR(im_pesanan_produk.tgl_pesanan) AS tahun"),
    ];
    const results = await dbStokBarang("im_pesanan_produk")
      .select(...query)
      .distinct()
      .groupByRaw("MONTH(im_pesanan_produk.tgl_pesanan)")
      .groupByRaw("YEAR(im_pesanan_produk.tgl_pesanan)")
      .groupBy("im_pesanan_produk.customer")
      .groupBy("im_pesanan_produk.kode_barang")
      .groupBy("im_pesanan_produk.nama_barang")
      .groupBy("im_pesanan_produk.satuan")
      .orderBy("im_pesanan_produk.tgl_pesanan", "desc")
      .limit(50)
      .where(function () {
        this.where("customer", "like", `%${text}%`)
          .orWhere("kode_barang", "like", `%${text}%`)
          .orWhere("nama_barang", "like", `%${text}%`)
          .orWhere("id", "like", `%${text}%`);
      });
    return res.json(results);
  } catch (error) {
    next(error);
  }
});

// ! AUTH ENDPOINT
router.post("/auth/login", async function (req, res, next) {
  try {
    const { username, password } = req.body as ILoginForm;
    const query = [
      "marketing_users.id",
      "marketing_users.nik",
      "marketing_users.username",
      "marketing_users.password",
      "marketing_users.roles",
      "marketing_users.created_at",
      "marketing_users.updated_at",
      "karyawan.nm_depan_karyawan AS nama",
      dbStokBarang.raw("NULLIF(karyawan.departemen,'0') AS departemen"),
    ];
    const isUserValid = (await dbStokBarang("marketing_users")
      .select(...query)
      .first()
      .joinRaw(
        "JOIN `m-payroll`.data_karyawan AS karyawan ON marketing_users.nik = karyawan.nik"
      )
      .where("username", username)) as IMarketingUser;
    if (!isUserValid) throw new Error("User is invalid");
    const isPasswordValid = bcrypt.compareSync(password, isUserValid.password);
    if (!isPasswordValid) throw new Error("Password is invalid");
    const token = jwt.sign({ ...isUserValid }, <string>secret_key, {
      expiresIn: "12h",
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

// ! USER ENDPOINT
router.get("/users", async function (req, res, next) {
  try {
    const user = verifyAuthorization(req);
    const limit = Number(<string>req.query?.limit) || 10;
    const offset = Number(<string>req.query?.offset) || 0;
    const query = [
      "marketing_users.id",
      "marketing_users.nik AS nik",
      "marketing_users.username",
      "marketing_users.roles",
      "karyawan.departemen",
      "karyawan.nm_depan_karyawan",
    ];
    const result = (await dbStokBarang("marketing_users")
      .select(...query)
      .limit(limit, { skipBinding: true })
      .offset(offset * limit, { skipBinding: true })
      .joinRaw(
        "LEFT JOIN `m-payroll`.data_karyawan AS karyawan ON karyawan.nik = marketing_users.nik"
      )) as Partial<IMarketingUser[]>;
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

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
    const isNikValid = await dbPayroll("data_karyawan")
      .first()
      .where("data_karyawan.nik", body.nik);
    if (!isNikValid) throw new Error("NIK is invalid");
    const encryptedPassword = bcrypt.hashSync(body.password, SALT);
    const data: ISignUpFormMarketing = {
      ...body,
      password: encryptedPassword,
    };
    const result = await dbStokBarang("marketing_users").insert(data);
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

router.put("/users/update", async function (req, res, next) {
  try {
    const user = verifyAuthorization(req);
    const body = req.body as Partial<IMarketingUser>;
    // ? user cannot modify other than his/her account
    if (user.roles === "USER" && user.nik !== body.nik)
      throw new Error("Invalid user/nik");
    if (body.roles) delete body.roles;
    if (body.password) body.password = bcrypt.hashSync(body.password, SALT);
    const result = await dbStokBarang("marketing_users").update(body);
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
    const isDeletedUserValid = (await dbStokBarang("marketing_users")
      .where({ nik })
      .first()) as IMarketingUser;
    if (!isDeletedUserValid) throw new Error("Selected user is invalid");
    if (isDeletedUserValid.roles === "ADMIN")
      throw new Error("Selected user is ADMIN that cannot be deleted");
    const result = await dbStokBarang("marketing_users")
      .where({ nik })
      .delete();
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

// ! PURCHASE ORDER ENDPOINT
router.get("/purchase-order", async function (req, res, next) {
  try {
    const user = verifyAuthorization(req);
    const limit = Number(<string>req.query?.limit) || 20;
    const offset = Number(<string>req.query?.offset) || 0;
    const query = [
      "im_pesanan_produk.id",
      dbStokBarang.raw("MONTH(im_pesanan_produk.tgl_pesanan) AS bulan"),
      dbStokBarang.raw("YEAR(im_pesanan_produk.tgl_pesanan) AS tahun"),
      "im_pesanan_produk.tgl_pesanan",
      "im_pesanan_produk.customer",
      "im_pesanan_produk.kode_barang",
      "im_pesanan_produk.nama_barang",
      "im_pesanan_produk.satuan",
      dbStokBarang.raw("SUM(im_pesanan_produk.qty) AS qty"),
      dbStokBarang.raw("MAX(im_pesanan_produk.harga) AS harga"),
      dbStokBarang.raw("IFNULL(SUM(qty) * MAX(harga),0) AS total"),
    ];
    const results = await dbStokBarang("im_pesanan_produk")
      .select(...query)
      .groupByRaw("MONTH(im_pesanan_produk.tgl_pesanan)")
      .groupByRaw("YEAR(im_pesanan_produk.tgl_pesanan)")
      .groupBy("im_pesanan_produk.customer")
      .groupBy("im_pesanan_produk.kode_barang")
      .groupBy("im_pesanan_produk.nama_barang")
      .groupBy("im_pesanan_produk.satuan")
      .orderBy("im_pesanan_produk.tgl_pesanan", "desc")
      .offset(offset * limit, { skipBinding: true })
      .limit(limit, { skipBinding: true });
    return res.json(results);
  } catch (error) {
    next(error);
  }
});

router.get("/purchase-order/:kode_barang", async function (req, res, next) {
  try {
    const user = verifyAuthorization(req);
    const { kode_barang } = req.params;
    const month = req.query.month as string;
    const year = req.query.year as string;
    if (!month || !year) throw new Error("Month & Year are required");
    const query = [
      "im_pesanan_produk.id",
      dbStokBarang.raw("MONTH(im_pesanan_produk.tgl_pesanan) AS bulan"),
      dbStokBarang.raw("YEAR(im_pesanan_produk.tgl_pesanan) AS tahun"),
      "im_pesanan_produk.tgl_pesanan",
      "im_pesanan_produk.customer",
      "im_pesanan_produk.kode_barang",
      "im_pesanan_produk.nama_barang",
      "im_pesanan_produk.satuan",
      dbStokBarang.raw("SUM(im_pesanan_produk.qty) AS qty"),
      dbStokBarang.raw("MAX(im_pesanan_produk.harga) AS harga"),
      dbStokBarang.raw("IFNULL(SUM(qty) * MAX(harga),0) AS total"),
    ];
    const results = await dbStokBarang("im_pesanan_produk")
      .select(...query)
      .first()
      .where(function () {
        this.where("im_pesanan_produk.kode_barang", kode_barang)
          .andWhereRaw("MONTH(im_pesanan_produk.tgl_pesanan) = ?", month)
          .andWhereRaw("YEAR(im_pesanan_produk.tgl_pesanan) = ?", year);
      })
      .groupByRaw("MONTH(im_pesanan_produk.tgl_pesanan)")
      .groupByRaw("YEAR(im_pesanan_produk.tgl_pesanan)")
      .groupBy("im_pesanan_produk.customer")
      .groupBy("im_pesanan_produk.kode_barang")
      .groupBy("im_pesanan_produk.nama_barang")
      .groupBy("im_pesanan_produk.satuan")
      .orderBy("im_pesanan_produk.tgl_pesanan", "desc");
    return res.json(results);
  } catch (error) {
    next(error);
  }
});

// ! COST CALCULATION PROCESS ENDPOINT
router.get("/cost-calculation", async function (req, res, next) {
  try {
    try {
      const user = verifyAuthorization(req);
      let { month, year, induk } = req.query;
      if (!induk) throw new Error("ID is required");
      const today = moment();
      if (!month) month = today.format("M");
      if (!year) year = today.format("YYYY");
      const query = [
        "pesanan_customer.bulan",
        "pesanan_customer.tahun",
        "bom_all_level_1.induk",
        "bom_all_level_1.jenis_barang",
        "bom_all_level_1.kode_barang",
        "bom_all_level_1.nama_barang",
        "bom_all_level_1.proses",
        "bom_all_level_1.satuan",
        "bom_all_level_1.mesin",
        "pesanan_customer.qty",
        dbStokBarang.raw(
          "IFNULL(bom_all_level_1.cycletime, bom_all_level_1.cytime_weld) AS cytime"
        ),
        "bom_all_level_1.trf_msn",
        "bom_all_level_1.cvt",
        dbStokBarang.raw(
          "IFNULL(pesanan_customer.qty * IFNULL(bom_all_level_1.cycletime, bom_all_level_1.cytime_weld) * bom_all_level_1.trf_msn / bom_all_level_1.cvt, 0) AS hrg_internal"
        ),
        "bom_all_level_1.hrg_outplan",
        dbStokBarang.raw(
          "IFNULL(IFNULL(pesanan_customer.qty * IFNULL(bom_all_level_1.cycletime, bom_all_level_1.cytime_weld) * bom_all_level_1.trf_msn / bom_all_level_1.cvt,0), bom_all_level_1.hrg_outplan) AS hrg_proses"
        ),
        "bom_all_level_1.maker",
      ];
      const results = await dbStokBarang("bom_all_level_1")
        .select(...query)
        .innerJoin(
          "pesanan_customer",
          "bom_all_level_1.induk",
          "pesanan_customer.induk"
        )
        .where(function () {
          this.where("bom_all_level_1.jenis_barang", "like", "%WIP%").andWhere(
            "bom_all_level_1.proses",
            "NOT LIKE",
            "%FINISH GOOD%"
          );
        })
        .where(function () {
          this.where("bom_all_level_1.induk", induk)
            .andWhere("pesanan_customer.bulan", month)
            .andWhere("pesanan_customer.tahun", year);
        });

      return res.json(results);
    } catch (error) {
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

// ! COST MATERIAL ENDPOINT
router.get("/cost-material", async function (req, res, next) {
  try {
    const user = verifyAuthorization(req);
    const today = moment();
    const month = Number(<string>req.query?.month) || today.format("M");
    const year = Number(<string>req.query?.year) || today.format("YYYY");
    const induk = <string>req.query.induk;
    if (!induk) throw new Error("Induk is required");
    const query = [
      "pesanan_customer.bulan",
      "pesanan_customer.tahun",
      "bom_all_level_1.induk",
      "bom_all_level_1.jenis_barang",
      "bom_all_level_1.kode_barang",
      "bom_all_level_1.nama_barang",
      "bom_all_level_1.satuan",
      "pesanan_customer.qty",
      "bom_all_level_1.bruto",
      dbStokBarang.raw("1 / bom_all_level_1.bruto AS material_pcs"),
      dbStokBarang.raw(
        "ROUND(pesanan_customer.qty * bom_all_level_1.bruto, 2) AS total_kebutuhan"
      ),
      "bom_all_level_1.hrg_outplan AS harga",
      dbStokBarang.raw(
        "ROUND(IFNULL(bom_all_level_1.hrg_outplan / (1/bom_all_level_1.bruto), 0), 0) AS harga_pcs"
      ),
      dbStokBarang.raw(
        "ROUND(pesanan_customer.qty * bom_all_level_1.bruto, 2) * IFNULL(bom_all_level_1.hrg_outplan / (1 / bom_all_level_1.bruto),0) AS total_cost_butuh"
      ),
      dbStokBarang.raw(
        "ROUND(pesanan_customer.qty * IFNULL(bom_all_level_1.hrg_outplan / (1 / bom_all_level_1.bruto),0),0) AS total_cost"
      ),
      "bom_all_level_1.spesifikasi",
    ];
    const results = await dbStokBarang("bom_all_level_1")
      .select(...query)
      .innerJoin(
        "pesanan_customer",
        "bom_all_level_1.induk",
        "pesanan_customer.induk"
      )
      .where("bom_all_level_1.jenis_barang", "LIKE", "%Raw Material%")
      .where(function () {
        this.where("bom_all_level_1.induk", induk)
          .andWhere("pesanan_customer.bulan", month)
          .andWhere("pesanan_customer.tahun", year);
      });
    return res.json(results);
  } catch (error) {
    next(error);
  }
});

export default router;