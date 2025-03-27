const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const db = require("./database.js");
const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json'), "utf-8"));
const bot = new Telegraf(config.telegramKey);
const lastfm = require("./lastfm.js");
async function main() {
    const database = await db();
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




    bot.launch()

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))
};

main();

