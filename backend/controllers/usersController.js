import db from "../config/db.js";
import bcrypt from "bcryptjs";

export const getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT USER_ID, FULLNAME, USERNAME, ROLE_ID, ACTIVE, TCREATED FROM A_USERS`
    );
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving users", error });
  }
};

// Get one user by ID
export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT USER_ID, FULLNAME, USERNAME, ROLE_ID, ACTIVE, TCREATED FROM A_USERS WHERE USER_ID = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user", error });
  }
};

// Create new user
export const createUser = async (req, res) => {
  const { FULLNAME, USERNAME, PASSWORD, ROLE_ID, ACTIVE } = req.body;

  try {
    const [existing] = await db.query("SELECT * FROM A_USERS WHERE USERNAME = ?", [USERNAME]);
    if (existing.length > 0)
      return res.status(400).json({ message: "Username already registered" });

    const hashedPassword = await bcrypt.hash(PASSWORD, 10);

    const [result] = await db.query(
      `INSERT INTO A_USERS (FULLNAME, USERNAME, PASSWORD, ROLE_ID, ACTIVE, TCREATED) VALUES (?, ?, ?, ?, ?, NOW())`,
      [FULLNAME, USERNAME, hashedPassword, ROLE_ID, ACTIVE ?? 1]
    );

    res.status(201).json({ USER_ID: result.insertId, FULLNAME, USERNAME });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error });
  }
};

// Update user by ID
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { FULLNAME, ROLE_ID, ACTIVE } = req.body;
  try {
    await pool.query(
      "UPDATE A_USERS SET FULLNAME = ?, ROLE_ID = ?, ACTIVE = ? WHERE USER_ID = ?",
      [FULLNAME, ROLE_ID, ACTIVE, id]
    );
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error });
  }
};

// Delete user by ID
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM A_USERS WHERE USER_ID = ?", [id]);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
};