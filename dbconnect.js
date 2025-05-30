import mysql from 'serverless-mysql'
export const db = mysql({
  config: {
    host: process.env.MYSQL_HOST,
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
        charset   : 'utf8mb4',
    collation : 'utf8mb4_unicode_ci'
  }
})
export async function sql_query(query, value = [], type = 'Single') {
  try {
    const results = await db.query(query, value)
    await db.end()
    if (type == 'Single') {
      return results[0]
    } else if (type == 'Count') {
      return results.length
    } else {
      return results
    }

  } catch (e) {
    console.log("e ==> ", e)
    throw Error("Database is not responding")
  }
}
