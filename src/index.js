const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const db = require("./database.js");
const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json'), "utf-8"));
const bot = new Telegraf(config.telegramKey);
async function main() {
    const database = await db();
    bot.command('login', async (ctx) => {
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
Questo link ha una durata di massimo 60 minuti.`);

        } catch (error) {
            console.error('Errore durante l\'ottenimento del token: /login ' + error);
            ctx.reply(`Errore durante l'ottenimento della sessione! Rifare l'intero procedimento da capo!`);
        }
    });

    bot.command('login_finish', async (ctx) => {

        const dbUser = await database.getUser(ctx.message.chat.username);
        if (!dbUser) return await ctx.reply("Prima di eseguire questo comando bisogna fare \`/login\`!")
        
        try {
            const apiSig = createApiSig({ api_key: TOKEN_LASTFM, method: method, token: dbUser.token });

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
    });






    bot.command('hipster', Telegraf.reply('λ'))
    bot.launch()

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))
};

main();

