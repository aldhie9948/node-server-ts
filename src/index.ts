import "dotenv/config";
import express, { Application } from "express";
import portalLaporan from "./routes/portal-laporan";
import errorHandler from "./lib/error-handler";
import laporanProduksi from "./routes/laporan-produksi";
import monitorGudang from "./routes/monitor-gudang";
import rencanaProduksi from "./routes/rencana-produksi";
import monitoring from "./routes/monitoring";
import kepatuhanKaryawan from "./routes/kepatuhan-karyawan";
import marketingApp from "./routes/marketing-app";
import monitorGudangV2 from "./routes/monitor-gudang-v2";
import moment from "moment";
import cors from "cors";
import logger from "./lib/logger";
import pesananProduk from "./routes/pesanan-produk";
moment.locale("id");

const app: Application = express();
app.use(express.json());
app.use(cors());
app.use(logger);
app.use("/api/portal-laporan", portalLaporan);
app.use("/api/laporan-produksi", laporanProduksi);
app.use("/api/monitor-gudang", monitorGudang);
app.use("/api/rencana-produksi", rencanaProduksi);
app.use("/api/monitoring", monitoring);
app.use("/api/kepatuhan-karyawan", kepatuhanKaryawan);
app.use("/api/marketing", marketingApp);
app.use("/api/monitor-gudang/v2", monitorGudangV2);
app.use("/api/pesanan-produk", pesananProduk);
app.use(errorHandler);
app.use("*", (_req, res) =>
  res.status(404).json({ error: "Unknown endpoint" })
);
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log("server is running on *:" + PORT);
});
