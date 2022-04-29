import database from '../database';

export function insert(table, data) {
    return new Promise<void>((resolve, reject) => {
        database.query(`INSERT INTO ${table} VALUES (?)`, [data], (err, result) => {
            if (err) reject(err);
            resolve();
        });
    });
}

export function exists(table, column, value) {
    return new Promise<boolean>((resolve, reject) => {
        database.query(`SELECT * FROM ${table} WHERE ${column} = ?`, [value], (err, result) => {
            if (err) reject(err);
            resolve(result.length > 0);
        });
    });
}

export function getAny(table) {
    return new Promise<any>((resolve, reject) => {
        database.query(`SELECT * FROM ${table}`, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    });
}