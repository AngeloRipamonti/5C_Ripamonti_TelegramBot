const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');
const db = require("./database.js");
const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json'), "utf-8"));
const bot = new Telegraf(config.telegramKey);
const lastfm = require("./lastfm.js");

async function main() {
    bot.telegram.setMyCommands([
        { command: `start`, description: `Avvia il bot e fornisce una guida` },
        { command: `user`, description: `Mostra la canzone che "username" sta ascoltando!` },
        { command: `whoknows`, description: `Mostra chi conosce 'l'artista, album o traccia' specificata! field va compilato in caso di album/track, inserendo esso.` },
        { command: `top`, description: `Mostra i tuoi 10 migliori 'artisti, album o tracce' per un periodo di tempo specificato!` }
    ]);

    const database = await db();
    await database.setup();
    const fmbot = lastfm(database, config);

    bot.command("start", (ctx) => {
        fmbot.guide(ctx);
    })

    bot.command('login', async (ctx) => {
        await fmbot.login(ctx);
    });

    bot.command('login_finish', async (ctx) => {
        await fmbot.login_finish(ctx);
    });

    bot.command("user", async function (ctx) {
        await fmbot.user(ctx);
    });

    bot.command("whoknows", async function (ctx) {
        await fmbot.whoknows(ctx);
    });

    bot.command("top", async function (ctx) {
        await fmbot.top(ctx);
    });

    bot.launch()

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))
};

main();

