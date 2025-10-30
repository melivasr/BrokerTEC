import sql from "mssql";

export const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

export async function queryDB(query, params = {}) {
  const pool = await sql.connect(dbConfig);
  const request = pool.request();
  Object.entries(params).forEach(([key, value]) =>
    request.input(key, value)
  );
  const result = await request.query(query);
  return result.recordset;
}
