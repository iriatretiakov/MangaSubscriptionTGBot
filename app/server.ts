var dotenv = require('dotenv').config();
import Telegraf from 'telegraf';
import { InputFileByURL } from 'telegraf/typings/telegram-types';
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
    repository.GetReadedTitlesByChatId(chatId as number).then(mangaSubscriptions => {
        var message = '';
        console.log('mangaSubscriptions', mangaSubscriptions);
        mangaSubscriptions.forEach(element => {
            message += `${element.TitleId} - ${element.TitleName} - ${element.LastChapter}\n`;
        })
        ctx.reply('Your subscription list:\n*Id - Name - LastChapter*\n'+ message, {parse_mode: 'Markdown'});
    });
   
});

// bot.hears(/\/init/, ctx => {
//     var chatId = ctx.message?.chat.id;
//     log.info(`init table called by ${chatId} at ${new Date().toJSON()}`);
//     try {
//         repository.InitTable();
//     }
//     catch(e) {
//         log.error(`add called by ${chatId} at ${new Date().toJSON()}, ${e}`);
//         ctx.reply(`Something went wrong!`);
//     }
//     finally {
//         ctx.reply('init table is called and processed.');
//     }
// })

bot.hears(/\/updateIds/, async ctx => {
    var chatId = ctx.message?.chat.id;
    log.info(`update ids called by  ${chatId} at ${new Date().toJSON()}`);
    try {
        repository.GetTitlesNameByChatId(chatId as number).then(async subscriptions => {
            for (const element of subscriptions) {
                var titleId = await mangadexService.GetMangaIdByName(element.TitleName);
                console.log(`found title with id - ${titleId} and name ${element.TitleName}`);
                element.TitleId = titleId;
                element.LastUpdatedAt = new Date();
                repository.UpdateTitleId(element);
            }
            ctx.reply(`Ids updated.`);
        });
    }
    catch(e) {
        log.error(`add called by ${chatId} at ${new Date().toJSON()}, ${e}`);
        ctx.reply(`Something went wrong!`);
    }

});

bot.hears(/\/add ((([0-9A-Fa-f]{8}[-][0-9A-Fa-f]{4}[-][0-9A-Fa-f]{4}[-][0-9A-Fa-f]{4}[-][0-9A-Fa-f]{12}))\|([0-9]+))/, async ctx => {
    var inputData = ctx.match as string[];
    const chatId = ctx.message?.chat.id;
    log.info(`add called by ${chatId} at ${new Date().toJSON()} with input data "${inputData[1]}"`);
    try {
        if (chatId) {

            console.log('inner call')
            const data = inputData[1].split('|');
            const titleId = (data[0].trim());
            const chapter = +(data[1].trim());
            console.log('data', data)
            console.log('titleId ', titleId, ' chapter ', chapter);
            repository.IsExists(titleId, chatId).then(async isExists => {
                if (!isExists) {
                    console.log('IsExists');
                    var mangaItem = await mangadexService.GetMangaById(titleId);
                    repository.AddTitle(titleId, mangaItem.localizedTitle.en, chapter, chatId);
                    ctx.reply(`${titleId} is added with chapter ${chapter}.`);
                    // console.log(repository.GetReadedTitles());
                    return;
                }
                else{
                    ctx.reply(`You already have this title in subscription list.`);
                    return;
                } 
            });     
        }
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

bot.hears(/\/rm ([0-9A-Fa-f]{8}[-][0-9A-Fa-f]{4}[-][0-9A-Fa-f]{4}[-][0-9A-Fa-f]{4}[-][0-9A-Fa-f]{12})/, ctx => {
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
        repository.GetReadedTitles().then(async readedTitles => {

            var res = await mangadexService.GetUpdated(readedTitles[0]);

            for (const element of readedTitles) {
                var lastChapter = await mangadexService.GetUpdated(element);
                if (lastChapter) {

                    const message = `There is new chapter for ${element.TitleName}
                    \nhttps://mangadex.org/chapter/${lastChapter.id}
                    \nTo update use command \`/upd ${element.TitleId}|${lastChapter.chapter}\` (tap to copy)`;
                    
                    await mangadexService.GetCoverName(element.TitleId).then(async coverName => {
                        await bot.telegram.sendPhoto(element.ChatId,
                            { url: coverName } as InputFileByURL,
                            {
                                caption: message,
                                parse_mode: "Markdown"
                            });
                    }).catch(async _ => {
                        await bot.telegram.sendMessage(element.ChatId,
                            message,
                            {
                                parse_mode: "Markdown"
                            });
                    });
                }
            }
        });
    }
    catch (e) {
        log.error(`scheduleJob called at ${new Date().toJSON()}, cause an error ${e}`);
    }
  }, null, true);

job.start();

bot.launch()


