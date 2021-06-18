var dotenv = require('dotenv').config();
import Telegraf from 'telegraf';
var CronJob = require('cron').CronJob;

// import schedule from 'node-schedule';
const log = require('simple-node-logger').createSimpleLogger('project.log');
import { TitleRepository } from "./DAL/titlesRepository"
import { MangadexApiService } from "./providers/mangadexProvider"

let TOKEN = process.env.BOT_TOKEN;
let CRONE = process.env.CHECK_CRONE;

const bot = new Telegraf(TOKEN as string);
const repository = new TitleRepository();
const mangadexService = new MangadexApiService();

bot.start(ctx => {
    var message = `Hello this bot is use to notify new updates for ongoing at mangadex
Commands exaples:
/list - get a list of my subscriptions
/rm - remove subscription by title id
/add - add title and last read chapter (use like \`/add {titleId}-{lastReadedChapter}\`)
/upd - update title last chapter  (use like \`/upd {titleId}-{lastReadedChapter}\`)`;
    ctx.reply(message, {parse_mode: 'Markdown'});
});

bot.hears(/\/list/, async ctx => {
    var chatId = ctx.message?.chat.id;
    log.info(`get my subscription list called by ${chatId} at ${new Date().toJSON()}`);
    var mangaSubscriptions = repository.GetReadedTitlesByChatId(chatId as number);
    var message = '';
    console.log('mangaSubscriptions', mangaSubscriptions);
    mangaSubscriptions.forEach(element => {
        message += `${element.TitleId} - ${element.TitleName} - ${element.LastChapter}\n`;
    })
    ctx.reply('Your subscription list:\n*Id - Name - LastChapter*\n'+ message, {parse_mode: 'Markdown'});
});

bot.hears(/\/updateIds/, async ctx => {
    var chatId = ctx.message?.chat.id;
    log.info(`update ids called by  ${chatId} at ${new Date().toJSON()}`);
    var subscriptions = repository.GetTitlesNameByChatId(chatId as number);

    for (const element of subscriptions) {
        var titleId = await mangadexService.GetMangaIdByName(element.TitleName);
        element.TitleId = titleId;
        element.LastUpdatedAt = new Date();
        repository.UpdateTitleId(element);
    }

    ctx.reply(`Ids updated.`);
});

bot.hears(/\/add ((([0-9A-Fa-f]{8}[-][0-9A-Fa-f]{4}[-][0-9A-Fa-f]{4}[-][0-9A-Fa-f]{4}[-][0-9A-Fa-f]{12}))\|([0-9]+))/, async ctx => {
    var inputData = ctx.match as string[];
    var chatId = ctx.message?.chat.id;
    log.info(`add called by ${chatId} at ${new Date().toJSON()} with input data "${inputData[1]}"`);
    try {
        if (chatId) {

            const data = inputData[1].split('|');
            const titleId = (data[0].trim());
            const chapter = +(data[1].trim());
            console.log('data', data)
            console.log('titleId ', titleId, ' chapter ', chapter);
            if (!repository.IsExists(titleId, chatId)) {
                console.log('IsExists');
                var mangaItem = await mangadexService.GetMangaById(titleId);
                console.log('mangaItem', mangaItem);
                repository.AddTitle(titleId, mangaItem.localizedTitle.en, chapter, chatId);
                ctx.reply(`${titleId} is added with chapter ${chapter}.`);
                // console.log(repository.GetReadedTitles());
                return;
            }
            else{
                ctx.reply(`You already have this title in subscription list.`);
                return;
            }
        }
        ctx.reply('nothing is added :(');
    }
    catch (e) {
        log.error(`add called by ${chatId} at ${new Date().toJSON()}, ${e}`);
        ctx.reply(`Something went wrong!`);
    }
});

bot.hears(/\/upd ((([0-9A-Fa-f]{8}[-][0-9A-Fa-f]{4}[-][0-9A-Fa-f]{4}[-][0-9A-Fa-f]{4}[-][0-9A-Fa-f]{12}))\|([0-9]+))/, ctx => {
    var inputData = ctx.match as string[];
    var chatId = ctx.message?.chat.id;
    log.info(`update called by ${chatId} at ${new Date().toJSON()} with input data "${inputData[1]}"`);
    try {
        if (chatId) {
            const data = inputData[1].split('|');
            console.log('data[1]', data[1]);
            repository.UpdateLastChapter((data[0].trim()), chatId, +(data[1].trim()));
            ctx.reply(`Last chapter updated to ${data[1].trim()} for ${data[0].trim()}.`);
            console.log(repository.GetReadedTitles());
            return;
        }
        ctx.reply('nothing to update :(');
    }
    catch (e) {
        log.error(`update called by ${chatId} at ${new Date().toJSON()}, ${e}`);
        ctx.reply(`Something went wrong!`);
    }
});

bot.hears(/\/rm (([0-9A-Fa-f]{8}[-][0-9A-Fa-f]{4}[-][0-9A-Fa-f]{4}[-][0-9A-Fa-f]{4}[-][0-9A-Fa-f]{12}))/, ctx => {
    var inputData = ctx.match as string[];
    var chatId = ctx.message?.chat.id;
    log.info(`remove called by ${chatId} at ${new Date().toJSON()} with input data "${inputData[1]}"`);
    try {
        if (chatId) {
            repository.RemoveTitleById((inputData[1].trim()), chatId);
            ctx.reply(`Subscription for ${inputData[1].trim()} was removed.`);
            console.log(repository.GetReadedTitles());
            return;
        }
        ctx.reply('nothing to remove :(');
    }
    catch (e) {
        log.error(`remove called by ${chatId} at ${new Date().toJSON()}, ${e}`);
        ctx.reply(`Something went wrong!`);
    }
});


var job = new CronJob(CRONE, async function() {
    try {
        log.info('scheduleJob is called at ', new Date().toJSON());
        var readedTitles = repository.GetReadedTitles();

        var res = await mangadexService.GetUpdated(readedTitles[0]);
        
        for(const element of readedTitles) {
            var lastChapter = await mangadexService.GetUpdated(element);
            if (lastChapter) {
                const message = `There is new chapter for ${element.TitleName}
                    \nhttps://mangadex.org/chapter/${lastChapter.id}
                    \nTo update use command \`/upd ${element.TitleId}-${lastChapter.id}\` (tap to copy)`;
                await bot.telegram.sendMessage(element.ChatId,
                    message,
                    {
                        parse_mode: "Markdown"
                    });

                    // await bot.telegram.sendPhoto(element.ChatId,
                    //     { url: mangaItem.manga.cover_url } as InputFileByURL,
                    //     {
                    //         caption: message,
                    //         parse_mode: "Markdown"
                    //     });
            }
        }  
    }
    catch (e) {
        log.error(`scheduleJob called at ${new Date().toJSON()}, cause an error ${e}`);
    }
  }, null, true);

job.start();

bot.launch()


