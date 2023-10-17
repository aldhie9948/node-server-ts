import "dotenv/config";
import express, { Application } from "express";
import portalLaporan from "./routes/portal-laporan";
import errorHandler from "./lib/error-handler";
import laporanProduksi from "./routes/laporan-produksi";
import monitorGudang from "./routes/monitor-gudang";
import moment from "moment";
import cors from "cors";
import logger from "./lib/logger";
moment.locale("id");

const app: Application = express();
app.use(express.json());
app.use(cors());
app.use(logger);
app.use("/api/portal-laporan", portalLaporan);
app.use("/api/laporan-produksi", laporanProduksi);
app.use("/api/monitor-gudang", monitorGudang);
app.use(errorHandler);
app.use("*", (req, res) => res.status(404).json({ error: "Unknown endpoint" }));
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log("server is running on *:" + PORT);
});
