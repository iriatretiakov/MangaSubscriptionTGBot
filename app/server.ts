require('dotenv').config();
import Telegraf from 'telegraf';
import schedule from 'node-schedule';
import { InputFileByURL } from 'telegraf/typings/telegram-types';
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
    mangaSubscriptions.forEach(element => {
        message += `${element.TitleId} - ${element.TitleName} - ${element.LastChapter}\n`;
    })
    ctx.reply('Your subscription list:\n*Id - Name - LastChapter*\n'+ message, {parse_mode: 'Markdown'});
});

bot.hears(/\/updateIds/, async ctx => {
    var chatId = ctx.message?.chat.id;
    log.info(`update ids called by  ${chatId} at ${new Date().toJSON()}`);
    var subscriptions = repository.GetTitlesNameByChatId(chatId as number);
    console.log('subsriptions', subscriptions);

    for (const element of subscriptions) {
        var titleId = await mangadexService.GetMangaIdByName(element.TitleName);
        element.TitleId = titleId;
        element.LastUpdatedAt = new Date();
        repository.UpdateTitleId(element);
    }

    ctx.reply(`Ids updated.`);
});

bot.hears(/\/add ([0-9]+-(([0-9]+\.[0-9]+)|([0-9]+)))/, async ctx => {
    var inputData = ctx.match as string[];
    var chatId = ctx.message?.chat.id;
    log.info(`add called by ${chatId} at ${new Date().toJSON()} with input data "${inputData[1]}"`);
    try {
        if (chatId) {

            const data = inputData[1].split('-');
            const titleId = +(data[0].trim());
            const chapter = +(data[1].trim());
            if (!repository.IsExists(titleId, chatId)) {
                var mangaItem = await mangadexService.GetMangaById(titleId.toString());
                // repository.AddTitle(titleId, mangaItem.manga.title, chapter, chatId);
                ctx.reply(`${titleId} is added with chapter ${chapter}.`);
                console.log(repository.GetReadedTitles());
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

bot.hears(/\/upd ([0-9]+-(([0-9]+\.[0-9]+)|([0-9]+)))/, ctx => {
    var inputData = ctx.match as string[];
    var chatId = ctx.message?.chat.id;
    log.info(`update called by ${chatId} at ${new Date().toJSON()} with input data "${inputData[1]}"`);
    try {
        if (chatId) {
            const data = inputData[1].split('-');
            console.log('data[1]', data[1]);
            repository.UpdateLastChapter(+(data[0].trim()), chatId, +(data[1].trim()));
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

bot.hears(/\/rm ([0-9]+)/, ctx => {
    var inputData = ctx.match as string[];
    var chatId = ctx.message?.chat.id;
    log.info(`remove called by ${chatId} at ${new Date().toJSON()} with input data "${inputData[1]}"`);
    try {
        if (chatId) {
            repository.RemoveTitleById(+(inputData[1].trim()), chatId);
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

schedule.scheduleJob(CRONE as string, async function() {
    try {
        console.log('scheduleJob is called at');
        log.info('scheduleJob is called at ', new Date().toJSON());
        var readedTitles = repository.GetReadedTitles();
        // readedTitles.forEach(async element => {
        //     var mangaItem = await mangadexService.GetMangaById(element.TitleId);
        //     var lastChapter = mangadexService.GetUpdated(element, mangaItem.chapter);
        //     if (lastChapter) {
        //         const message = `There is new chapter for ${mangaItem.manga.title}
        //     \nhttps://mangadex.org/chapter/${lastChapter.id}
        //     \nTo update use command \`/upd ${element.TitleId}-${lastChapter.chapter}\` (tap to copy)`;
        //         await bot.telegram.sendPhoto(element.ChatId,
        //             { url: mangaItem.manga.cover_url } as InputFileByURL,
        //             {   
        //                 caption: message,
        //                 parse_mode: "Markdown"
        //             });
        //     }
        // })
    }
    catch (e) {
        log.error(`scheduleJob called at ${new Date().toJSON()}, cause an error ${e}`);
    }
});

bot.launch()


