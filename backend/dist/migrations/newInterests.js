"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateNewInterests = migrateNewInterests;
const database_1 = __importDefault(require("../database"));
function migrateNewInterests() {
    const columns = database_1.default.prepare("PRAGMA table_info(contacts)").all();
    const existing = columns.map(c => c.name);
    const newInterests = [
        'interest_race_play',
        'interest_piggy',
        'interest_role_play',
        'interest_age_play',
        'interest_cum_dump',
        'interest_younger',
        'interest_older',
        'interest_hairy',
        'interest_smooth',
        'interest_muscular',
        'interest_jocks',
    ];
    for (const col of newInterests) {
        if (!existing.includes(col)) {
            database_1.default.exec(`ALTER TABLE contacts ADD COLUMN ${col} INTEGER NOT NULL DEFAULT 0`);
            console.log(`✅ Added column: ${col}`);
        }
    }
}
