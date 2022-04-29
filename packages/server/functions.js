import { join } from 'path';
import { readdir, lstatSync } from 'fs';

function readFiles(dir, padding = '', paths = []) {
    return new Promise((resolve, reject) => {
        readdir(dir, async (error, files) => {
            if (error || files == undefined) return resolve();
            for (var i = 0; i < files.length; i++) {
                const location = join(dir, files[i]);
                try {
                    const fileType = lstatSync(location);
                    paths.push(padding + location);
                    //console.log(padding + location);
                    //console.log(fileType.isDirectory(), location);
                    if (fileType.isDirectory()) await readFiles(location, padding + '  ', paths);
                } catch (error) {
                    //console.log(error);
                    //console.log('Failed due to privacy', location);
                    //return;
                }
            }
            return resolve(paths);
        });
    });
}

function readDir(dir, paths=[]) {
    return new Promise((resolve, reject) => {
        readdir(dir, async (error, files) => {
            console.log(error);
            if (error || files == undefined) return resolve();
            for (var i = 0; i < files.length; i++) {
                const location = join(dir, files[i]);
                try {
                    paths.push(location);
                } catch (error) {
                    
                }
            }
            return resolve(paths);
        });
    });
}