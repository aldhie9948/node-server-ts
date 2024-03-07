export type Roles = "ADMIN" | "USER";
export interface ISignUpFormMarketing {
  nik: string;
  password: string;
  username: string;
  roles: Roles;
}
export interface IMarketingUser {
  id: number;
  nik: string;
  username: string;
  password: string;
  roles: Roles;
  created_at: string;
  updated_at: string;
}

export interface ILoginForm {
  username: string;
  password: string;
}

export interface IPesananProdukForm {
  tgl_pesanan: string;
  no_pesanan: string;
  customer: string;
  kode_barang: string;
  nama_barang: string;
  qty: number;
  satuan: string;
  harga: number;
}
