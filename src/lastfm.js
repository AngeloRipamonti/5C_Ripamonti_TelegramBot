const fetch = require('node-fetch');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

module.exports = function lastfm(database, config) {
    function createApiSign(params) {
        const paramString = Object.keys(params).sort().map(key => key + params[key]).join('');
        const hash = crypto.createHash('md5').update(paramString + config.secret_lastfm).digest('hex');
        return hash;
    }
    async function handleWhoknowsAlbum(ctx, result, args) {
        const artist = args[1];
        const album = args[2];
        if (!album || !artist) {
            result = `Album o Artista non trovati!`
            ctx.reply(result);
            return;
        }
        const users = await database.getUsers();

        try {
            const promises = users.map(async user => {
                const params = new URLSearchParams({
                    method: 'album.getinfo',
                    artist: artist,
                    album: album,
                    username: user.username,
                    api_key: config.token_lastfm,
                    format: 'json'
                });
                const response = await fetch(`http://ws.audioscrobbler.com/2.0/?${params.toString()}`);
                const data = await response.json();
                return data;
            });

            const results = await Promise.all(promises);
            const userScrobbles = results.map((result, index) => ({
                username: `**[${users[index].username}](https://www.last.fm/user/${users[index].username})**`,
                playcount: result.album.userplaycount
            }));

            userScrobbles.sort((a, b) => b.playcount - a.playcount);

            const formattedResult = userScrobbles.map((user, index) => `${index + 1}. ${user.username} ・ **${user.playcount}** plays\n`);
            result += `**[${album}](${results[0].album.url})**\n\n${formattedResult.slice(0, 10).join("")}`
            ctx.reply(result, { parse_mode: "MarkdownV2" });
        }
        catch (err) {
            console.error("handleWhoknowsAlbum: " + err);
            result = `Errore durante il wka!`;
            ctx.reply(result);
        }
    }
    async function handleWhoknowsArtist(ctx, result, args) {
        const artist = args[1];
        if (!artist) {
            result += (`Artista non trovato!`)
            ctx.reply(result);
            return;
        }
        const users = await database.getUsers();
        try {
            const promises = users.map(async user => {
                const params = new URLSearchParams({
                    method: 'artist.getinfo',
                    artist: artist,
                    username: user.username,
                    api_key: config.token_lastfm,
                    format: 'json'
                });
                const response = await fetch(`http://ws.audioscrobbler.com/2.0/?${params.toString()}`);
                const data = await response.json();
                return data;
            });

            const results = await Promise.all(promises);
            const userScrobbles = results.map((result, index) => ({
                username: `**[${users[index].username}](https://www.last.fm/user/${users[index].username})**`,
                playcount: result.artist.stats.userplaycount
            }));

            userScrobbles.sort((a, b) => b.playcount - a.playcount);

            const formattedResult = userScrobbles.map((user, index) => `${index + 1}. ${user.username} ・ **${user.playcount}** plays\n`);
            result += `**[${artist}](${results[0].artist.url})**\n\n${formattedResult.slice(0, 10).join("")}`
            ctx.reply(result, { parse_mode: "MarkdownV2" });
        }
        catch (err) {
            console.error("handleWhoknowsArtist: " + err);
            result = `Errore durante il wk!`;
            ctx.reply(result);
        }
    }
    async function handleWhoknowsTrack(ctx, result, args) {
        const artist = args[1];
        const track = args[2];
        if (!track || !artist) {
            result = `Canzone o Artista non trovati!`;
            ctx.reply(result);
            return;
        }
        const users = await database.getUsers();

        try {
            const promises = users.map(async user => {
                const params = new URLSearchParams({
                    method: 'track.getinfo',
                    artist: artist,
                    track: track,
                    username: user.username,
                    api_key: config.token_lastfm,
                    format: 'json'
                });
                const response = await fetch(`http://ws.audioscrobbler.com/2.0/?${params.toString()}`);
                const data = await response.json();
                return data;
            });

            const results = await Promise.all(promises);
            const userScrobbles = results.map((result, index) => ({
                username: `**[${users[index].username}](https://www.last.fm/user/${users[index].username})**`,
                playcount: result.track.userplaycount
            }));

            userScrobbles.sort((a, b) => b.playcount - a.playcount);

            const formattedResult = userScrobbles.map((user, index) => `${index + 1}. ${user.username} ・ **${user.playcount}** plays\n`);
            result += `**[${track}](${results[0].track.url})**\n\n${formattedResult.slice(0, 10).join("")}`
            ctx.reply(result, { parse_mode: "MarkdownV2" });
        }
        catch (err) {
            console.error("handleWhoknowsTrack: " + err);
            result = `Errore durante il wkt!`
            ctx.reply(result);
        }
    }

    return {
        guide: function (ctx) {
            ctx.reply(`📌 Per __registrarti__ al servizio di **__LastFm__** su FmBot, dovrai seguire questi __passaggi__:
> **\`1.\`** Dovrai usare il comando **\`/login\`** e seguire le sue **indicazioni**!
> **\`2.\`** Una volta che avrai dato accesso a __OceanBot__ sul tuo **account lastfm** dovrai tornare qui su discord e usare il comando **\`/login_finish\`** cosi da completare la __registrazione__ della tua *sessione*!

**🔗 Comandi:**
> 📌 \`/user (username)\` ➜ Mostra la canzone che "username" sta ascoltando! (e.g. */user XxAngelo3040xX*)
> 📌 \`/whoknows [artist | album | track] [artista] (field)\` ➜ Mostra chi conosce 'l'artista, album o traccia' specificata! field va compilato in caso di album/track, inserendo esso. (e.g. */whoknows track Olly Balorda nostalgia*)
> 📌 \`/top [artist | album | track] [weekly | monthly | annual | alltime] (username)\` ➜ Mostra i tuoi 10 migliori 'artisti, album o tracce' per un periodo di tempo specificato! (e.g. */top artist alltime XxAngelo3040xX*)

**⚠️ Legenda:**
**(**xxx**)** ➜ Parametro opzionale
**[**xxx**]** ➜ Parametro obbligatorio
[xxx **|** yyy **|** zzz] ➜ Parametro obbligatorio da scegliere tra le opzioni`, { parse_mode: "MarkdownV2" });
        },
        login: async function (ctx) {
            //console.log(ctx);

            await database.delete(ctx.message.chat.username).catch(console.error);

            let token;
            try {
                const params = new URLSearchParams({
                    method: 'auth.getToken',
                    api_key: config.token_lastfm,
                    format: 'json'
                });
                const response = await fetch(`http://ws.audioscrobbler.com/2.0/?${params.toString()}`);
                const data = await response.json();
                token = data.token;

                console.log(`Token: ${token}`);

                await database.addUser({
                    user_id: ctx.message.chat.username,
                    token: token
                });

                ctx.reply(`Autorizza il bot al tuo account Last.Fm per il completo utilizzo delle sue funzionalità!
[Clicca questo link](https://www.last.fm/api/auth?api_key=${config.token_lastfm}&token=${token})
Questo link ha una durata di massimo 60 minuti.`, { parse_mode: "MarkdownV2" });

            } catch (error) {
                console.error('Errore durante l\'ottenimento del token: /login ' + error);
                ctx.reply(`Errore durante l'ottenimento della sessione! Rifare l'intero procedimento da capo!`);
            }
        },
        login_finish: async function (ctx) {
            const dbUser = await database.getUser(ctx.message.chat.username);
            if (!dbUser) return await ctx.reply("Prima di eseguire questo comando bisogna fare \`/login\`!")

            try {
                const apiSig = createApiSign({ api_key: config.token_lastfm, method: method, token: dbUser.token });

                const params = new URLSearchParams({
                    method: 'auth.getSession',
                    api_key: config.token_lastfm,
                    token: dbUser.token,
                    api_sig: apiSig,
                    format: 'json'
                });
                const response = await fetch(`http://ws.audioscrobbler.com/2.0/?${params.toString()}`);
                const data = await response.json();
                const session = data.session;
                console.log('Session:', session);
                dbUser.session_key = session.key;
                dbUser.username = session.name;
                await database.updateUser(dbUser).catch(console.error);
                await ctx.reply(`Registrazione completata con successo!`);
            } catch (error) {
                ctx.reply(`Errore durante l'ottenimento della sessione! Rifare l'intero procedimento da capo!`);
                console.error('Errore durante l\'ottenimento della sessione in lastfm login finish: ' + error);
            }
        },
        user: async function (ctx) {
            const args = ctx.message.text.split(" ").slice(1);
            const username = args[0];
            const iuser = username ?? ctx.message.chat.username;

            const dbUser = await database.getUser(iuser);
            if (!dbUser) return await ctx.reply(`${iuser} non è loggato!`);

            const apiSig = createApiSign({ api_key: config.token_lastfm, method: "user.getrecenttracks", user: dbUser.username });
            try {
                const params = new URLSearchParams({
                    method: "user.getrecenttracks",
                    user: dbUser.username,
                    api_key: config.token_lastfm,
                    api_sig: apiSig,
                    format: 'json'
                });
                const response = await fetch(`http://ws.audioscrobbler.com/2.0/?${params.toString()}`);
                const data = await response.json();
                const tracks = data.recenttracks.track;

                let result = `<a href="https://www.last.fm/user/${dbUser.username}">Ultima track di ${iuser}</a>\n\n`;
                result += `<b><a href="${tracks[0].url}">${tracks[0].name}</a></b>\n\n`;
                result += `<b>${tracks[0].artist["#text"]}</b> ・ <i>${tracks[0].name}</i>\n\n`;
                result += `<i>${tracks[0].date ? tracks[0].date["#text"] : " "}</i>`;

                ctx.replyWithPhoto(tracks[0].image[3]["#text"], { caption: result, parse_mode: 'HTML' });
            }
            catch (e) {
                console.error("user: " + e);
                ctx.reply(`Errore durante l'ottenimento dello user, verificarsi che sia loggato correttamente al servizio!`);
            }
        },
        whoknows: async function (ctx) {
            let result = "";
            const args = ctx.message.text.split(" ").slice(1);
            switch (args[0]) {
                case "artist":
                    await handleWhoknowsArtist(ctx, result, args);
                    break;
                case "album":
                    await handleWhoknowsAlbum(ctx, result, args);
                    break;
                case "track":
                    await handleWhoknowsTrack(ctx, result, args);
                    break;
                default:
                    result = `Errore durante l'ottenimento del tipo!`
                    ctx.reply(result);
                    return;
            }
        }
    }
}