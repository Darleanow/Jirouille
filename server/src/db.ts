import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import dotenv from "dotenv";
dotenv.config();

export let db: Database<sqlite3.Database, sqlite3.Statement>;
const DB_PATH = process.env.DB_PATH || "./data/app.db";

export async function initDB() {
    db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    await db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        passhash TEXT NOT NULL,
        createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ws_sessions (
        id TEXT PRIMARY KEY,
        userId TEXT,
        connectedAt TEXT NOT NULL,
        disconnectedAt TEXT,
        lastLatencyMs INTEGER,
        FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        at TEXT NOT NULL,
        level TEXT NOT NULL,
        scope TEXT NOT NULL,
        message TEXT NOT NULL,
        meta TEXT
    );
    `);
}
