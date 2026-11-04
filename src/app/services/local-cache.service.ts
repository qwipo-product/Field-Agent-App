import { Injectable } from "@angular/core";
const Sqlite = require("nativescript-sqlite");

@Injectable({
    providedIn: "root",
})
export class localCacheService {
    private DB_NAME: string = "qwipo.db";
    private db: any;
    private isInstantiated: boolean = false;

    constructor() {
        this.initializeSqlDB()
            .then(() => {
                console.log("Database initialized successfully.");
            })
            .catch((error) => {
                console.error(
                    "Error occurred during database initialization:",
                    error
                );
            });
    }

    private async initializeSqlDB(): Promise<void> {
        try {
            const dbExists = await Sqlite.exists(this.DB_NAME);
            if (!dbExists) {
                this.db = await new Sqlite("qwipo.db");
                await this.db.execSQL(
                    `CREATE TABLE IF NOT EXISTS qwipoKeys (key TEXT, value TEXT, isReset INTEGER)`
                );
                await this.db.execSQL(
                    "CREATE UNIQUE INDEX IF NOT EXISTS idx_Key ON qwipoKeys (key)"
                );
                this.isInstantiated = true;
            } else {
                this.db = await new Sqlite("qwipo.db");
                this.isInstantiated = true;
            }
        } catch (error) {
            console.error(
                "Error occurred during database initialization:",
                error
            );
            throw error;
        }
    }

    async get(key: string): Promise<any> {
        if (!this.isInstantiated) {
            console.error("Database is not initialized.");
            return null;
        }

        const query = "SELECT key, value FROM qwipoKeys WHERE key = ?";
        try {
            const row = await this.db.get(query, [key]);
            const response = row ? row[1] || null : null;
            return typeof response === "string"
                ? JSON.parse(response)
                : response;
        } catch (error) {
            console.error("Error occurred in actual get:", error);
            return null;
        }
    }

    async set(
        key: string,
        value: any,
        isReset: boolean = false
    ): Promise<string> {
        if (!this.isInstantiated) {
            console.error("Database is not initialized.");
            return null;
        }

        const stringifyValue = JSON.stringify(value);
        const query =
            "INSERT OR REPLACE INTO qwipoKeys (key, value, isReset) VALUES (?, ?, ?)";

        try {
            await this.db.execSQL(query, [
                key,
                stringifyValue,
                isReset ? 1 : 0,
            ]);

            return key;
        } catch (error) {
            console.error("INSERT ERROR", error);
            return null;
        }
    }

    async remove(key: string): Promise<void> {
        if (!this.isInstantiated) {
            console.error("Database is not initialized.");
            return;
        }

        const query = "DELETE FROM qwipoKeys WHERE key = ?";

        try {
            await this.db.execSQL(query, [key]);
        } catch (error) {
            console.error("DELETE ERROR", error);
        }
    }

    async resetPartial(): Promise<void> {
        if (!this.isInstantiated) {
            console.error("Database is not initialized.");
            return;
        }

        const query = "DELETE FROM qwipoKeys WHERE isReset = 1";

        try {
            await this.db.execSQL(query);
        } catch (error) {
            console.error("DELETE ERROR", error);
        }
    }

    async reset(): Promise<void> {
        if (!this.isInstantiated) {
            console.error("Database is not initialized.");
            return;
        }

        const query = "DELETE FROM qwipoKeys";

        try {
            await this.db.execSQL(query);
        } catch (error) {
            console.error("DELETE ERROR", error);
        }
    }


    async getAll(): Promise<{ key: string; value: any }[]> {
        if (!this.isInstantiated) {
            console.error("Database is not initialized.");
            return [];
        }

        const query = "SELECT key, value FROM qwipoKeys";
        try {
            const rows = await this.db.all(query);
            return rows.map((row) => ({
                key: row[0],
                value: this.parseValue(row[1]),
            }));
        } catch (error) {
            console.error("Error fetching all key-value pairs:", error);
            return [];
        }
    }

    private parseValue(value: string): any {
        try {
            return JSON.parse(value);
        } catch {
            console.warn("Failed to parse value:", value);
            return value; // Return raw value if parsing fails
        }
    }


}
