import knex from "knex";

const host = process.env.NODE_ENV === "development" ? "localhost" : "127.0.0.1";

export default function initKnex(database: string) {
  return knex({
    client: "mysql",
    connection: {
      host,
      port: 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database,
    },
    debug: false,
  });
}
