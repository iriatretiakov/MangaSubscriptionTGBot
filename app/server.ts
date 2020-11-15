require('dotenv').config();
import Telegraf from 'telegraf';
import schedule from 'node-schedule';
import { InputFileByURL } from 'telegraf/typings/telegram-types';
const sqlite = require('sqlite-sync');
const Mangadex = require('mangadex-api');
const log = require('simple-node-logger').createSimpleLogger('project.log');

sqlite.connect('data/data.db'); 

sqlite.run(`CREATE TABLE IF NOT EXISTS ReadedTitles(Id  INTEGER PRIMARY KEY AUTOINCREMENT, 
    TitleId integer not null,
    LastChapter integer not null,
    ChatId integer not null);`, function (res: { error: any; }) {
    if (res.error)
        throw res.error;
    console.log(res);
});

const client = new Mangadex();

let TOKEN = process.env.BOT_TOKEN;
let CRONE = process.env.CHECK_CRONE;

const bot = new Telegraf(TOKEN as string);

bot.hears(/\/start/, async ctx => {
    var chatId = ctx.message?.chat.id;
    log.info(`start called by ${chatId} at ${new Date().toJSON()}`);
    ctx.reply('Hello! '+ chatId);
});

bot.hears(/\/add ([^;'"]+)/, ctx => {
    var inputData = ctx.match as string[];
    var chatId = ctx.message?.chat.id;
    log.info(`add called by ${chatId} at ${new Date().toJSON()} with input data "${inputData[1]}"`);
    try {
        if (chatId) {

            const data = inputData[1].split('-');
            AddTitle(+(data[0].trim()), +(data[1].trim()), chatId);
            ctx.reply(`${data[0].trim()} is added with chapter ${data[1].trim()}.`);
            console.log(GetReadedTitles());
            return;
        }
        ctx.reply('nothig is added :(');
    }
    catch (e) {
        log.error(`add called by ${chatId} at ${new Date().toJSON()}, ${e}`);
        ctx.reply(`Something went wrong!`);
    }
});

bot.hears(/\/upd ([^;'"]+)/, ctx => {
    var inputData = ctx.match as string[];
    var chatId = ctx.message?.chat.id;
    log.info(`update called by ${chatId} at ${new Date().toJSON()} with input data "${inputData[1]}"`);
    try {
        if (chatId) {
            const data = inputData[1].split('-');
            UpdateLastChapter(+(data[0].trim()), chatId, +(data[1].trim()));
            ctx.reply(`Last chapter updated to ${data[1].trim()} for ${data[0].trim()}.`);
            console.log(GetReadedTitles());
            return;
        }
        ctx.reply('nothig is updated :(');
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
            RemoveTitleById(+(inputData[1].trim()), chatId);
            ctx.reply(`Subscription for ${inputData[1].trim()} was removed.`);
            console.log(GetReadedTitles());
            return;
        }
        ctx.reply('nothig is remove :(');
    }
    catch (e) {
        log.error(`remove called by ${chatId} at ${new Date().toJSON()}, ${e}`);
        ctx.reply(`Something went wrong!`);
    }
});

schedule.scheduleJob(CRONE as string, async function() {
    try {
        log.info('scheduleJob is called at ', new Date().toJSON());
        var readedTitles = GetReadedTitles();
        readedTitles.forEach(async element => {
            var mangaItem = await GetMangaById(element.TitleId);
            var lastChapter = GetUpdated(element, mangaItem.chapter);
            if (lastChapter) {
                const message = `There is new chapter for ${mangaItem.manga.title}
            \nhttps://mangadex.org/chapter/${lastChapter.id}`;
                await bot.telegram.sendPhoto(element.ChatId,
                    { url: mangaItem.manga.cover_url } as InputFileByURL,
                    { caption: message })
            }
        })
    }
    catch (e) {
        log.error(`scheduleJob called at ${new Date().toJSON()}, cause an error ${e}`);
    }
});

function addChatId(chatId: number): void {
    var userId = GetUserId(chatId);
    if (!userId) {
        sqlite.insert('UsersChat', { chatId: chatId }, function (res: { error: any; }) {
            if (res.error)
                throw res.error;
            console.log(res);
        });
    }
}

function GetReadedTitles(): ReadedTitles[] {
    return sqlite.run(`select * from ReadedTitles`);
}

function GetUserId(chatId: number) {
    return sqlite.run(`select id from UsersChat where ChatId=${chatId}`)[0];
}

function AddTitle(titleId: number, lastReadedChapter:number, chatId: number) {
    sqlite.insert('ReadedTitles', { TitleId: titleId, LastChapter: lastReadedChapter, ChatId: chatId }, function (res: { error: any; }) {
        if (res.error)
            throw res.error;
        console.log(res);
    });
}

function UpdateLastChapter(titleId: number, chatId: number, lastChapter: number) {
    sqlite.run(`Update ReadedTitles
    set LastChapter = ${lastChapter}
    where TitleId = ${titleId} and ChatId = ${chatId}`);
}

function RemoveTitleById(titleId: number, chatId: number){
    return sqlite.delete('ReadedTitles', {TitleId: titleId, Chatid: chatId});
}

function GetUpdated(subscription: ReadedTitles, chapters: Chapter[]): Chapter | null{
    var newChater = chapters
        .find(x => 
            (x.lang_code == 'gb' || x.lang_code == 'ru') && 
            +x.chapter > subscription.LastChapter);
    return newChater ? newChater : null;
}

async function GetMangaById(titleId: number): Promise<MangadexManga> {
    return await client.getManga(titleId).then((response: any) => {
        return response;
    })
}

bot.launch()

interface ReadedTitles {
    Id: number;
    TitleId: number;
    LastChapter: number;
    ChatId: number;
}

interface MangadexManga {
    manga: Manga;
    chapter: Chapter[];
}

interface Manga {
    cover_url: string;
    description: string;
    title: string;
    artist: string;
    author: string;
    covers: string[];
}

interface Chapter {
    id: number;
    lang_name: string;
    volume: string;
    chapter: string;
    title: string;
    lang_code: string;
}

