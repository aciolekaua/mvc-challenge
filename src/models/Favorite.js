const { pool } = require("../config/database");

class Favorite {
  static async toggle(user_id, book_id) {
    const { rowCount } = await pool.query(
      `DELETE FROM favorites WHERE user_id = $1 AND book_id = $2`,
      [user_id, book_id]
    );
    if (rowCount > 0) {
      return { favorited: false };
    }
    await pool.query(
      `INSERT INTO favorites (user_id, book_id) VALUES ($1, $2)`,
      [user_id, book_id]
    );
    return { favorited: true };
  }

  static async isFavorite(user_id, book_id) {
    const { rows } = await pool.query(
      `SELECT 1 FROM favorites WHERE user_id = $1 AND book_id = $2`,
      [user_id, book_id]
    );
    return rows.length > 0;
  }
}

module.exports = { Favorite };
