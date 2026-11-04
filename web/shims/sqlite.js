// Browser stand-in for "nativescript-sqlite" (CommonJS, because the app loads it with require()).
// app/services/local-cache.service.ts only uses one key/value table, so this keeps that table in
// localStorage and understands just those statements.
const STORAGE_KEY = 'fa-demo:sqlite:qwipoKeys';

function load() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
}

function save(rows) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch {
        /* storage unavailable: keep rows in memory only */
    }
}

class Sqlite {
    constructor() {
        this.rows = load();
        return Promise.resolve(this);
    }

    static exists() {
        return Promise.resolve(localStorage.getItem(STORAGE_KEY) != null);
    }

    execSQL(sql, params = []) {
        const q = sql.trim().toUpperCase();
        if (q.startsWith('INSERT OR REPLACE')) {
            const [key, value, isReset] = params;
            this.rows[key] = { value, isReset: Number(isReset) || 0 };
        } else if (q.startsWith('DELETE') && q.includes('WHERE KEY')) {
            delete this.rows[params[0]];
        } else if (q.startsWith('DELETE') && q.includes('ISRESET')) {
            Object.keys(this.rows).filter((k) => this.rows[k].isReset === 1).forEach((k) => delete this.rows[k]);
        } else if (q.startsWith('DELETE')) {
            this.rows = {};
        }
        save(this.rows);
        return Promise.resolve();
    }

    get(_sql, params = []) {
        const row = this.rows[params[0]];
        return Promise.resolve(row ? [params[0], row.value] : null);
    }

    all() {
        return Promise.resolve(Object.entries(this.rows).map(([key, row]) => [key, row.value]));
    }
}

module.exports = Sqlite;
