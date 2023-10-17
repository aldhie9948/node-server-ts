import knex from "knex";

export default function initKnex(database: string) {
  return knex({
    client: "mysql",
    connection: {
      host: "localhost",
      port: 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database,
    },
    debug: false,
  });
}
