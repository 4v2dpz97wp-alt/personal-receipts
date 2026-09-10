"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateCommonResponses = migrateCommonResponses;
const database_1 = __importDefault(require("../database"));
function migrateCommonResponses() {
    database_1.default.prepare(`
    CREATE TABLE IF NOT EXISTS common_responses (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      category    TEXT NOT NULL DEFAULT 'General',
      body        TEXT NOT NULL,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      usage_count INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();
    console.log('✅ common_responses table ready');
}
