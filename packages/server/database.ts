import * as mysql from 'mysql';
import config from '../../config.json';

const con = mysql.createConnection({
    ...config.db
});

export async function connectDatabase() {
    return new Promise<void>((resolve, reject) => {
        con.connect((err) => {
            if (err) return reject(err);
            console.log('Database Connected!');
            return resolve();
        });
    });
}

export default con;