const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { join } = require("path");
module.exports = async function database() {
    let db;

    await open({
        filename: join(process.cwd(), 'lastfm.db'),
        driver: sqlite3.cached.Database,
        mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
    }).then((d) => {
        console.log('Connessione al database avvenuta con successo');
        db = d;
    }).catch((err) => {
        console.error(`Errore nella connessione al database: ${err.message}`);
        throw err;
    });

    
    async function _query(sql, params) {
        return db.all(sql, params);
    }

    async function _get(sql, params) {
        return db.get(sql, params);
    }

    return {
        setup: async function(){
            await db.run(`CREATE TABLE IF NOT EXISTS lastfm(
                user_id TEXT PRIMARY KEY,
                token TEXT UNIQUE,
                session_key TEXT UNIQUE,
                username TEXT
            );`);
            console.log("Database setup completato")
        },
        getUsers: async function(){
            return await _query("SELECT * FROM lastfm;");
        },
        getUser: async function(userID){
            return await _get("SELECT * FROM lastfm WHERE user_id = ?;", [userID]);
        },
        addUser: async function(user){
            await db.run(`INSERT INTO lastfm (user_id, token) VALUES(?,?);`, [user.user_id, user.token]);
        },
        updateUser: async function(user){
            await db.run(`UPDATE lastfm SET session_key = ?, username = ? WHERE user_id = ?;`, [user.session_key, user.username, user.user_id]);
        },
        deleteUser: async function(userID){
            await db.run(`DELETE FROM lastfm WHERE user_id = ?;`, [userID]);
        }
    };
};