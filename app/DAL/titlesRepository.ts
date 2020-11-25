import { ReadedTitles } from "../model/title";

const sqlite = require('sqlite-sync');

export class TitleRepository {
    constructor() {
        sqlite.connect('data/data.db');

        sqlite.run(`CREATE TABLE IF NOT EXISTS ReadedTitles(Id  INTEGER PRIMARY KEY AUTOINCREMENT, 
    TitleId integer not null,
    LastChapter integer not null,
    ChatId integer not null);`, function (res: { error: any; }) {
            if (res.error)
                throw res.error;
            console.log(res);
        });
    }

    GetReadedTitles(): ReadedTitles[] {
        return sqlite.run(`select * from ReadedTitles`);
    }

    GetReadedTitlesByChatId(chatId: number): ReadedTitles[] {
        return sqlite.run(`select * from ReadedTitles where ChatId=${chatId}`);
    }

    GetUserId(chatId: number) {
        return sqlite.run(`select id from UsersChat where ChatId=${chatId}`)[0];
    }

    AddTitle(titleId: number, lastReadedChapter: number, chatId: number) {
        sqlite.insert('ReadedTitles', { TitleId: titleId, LastChapter: lastReadedChapter, ChatId: chatId }, function (res: { error: any; }) {
            if (res.error)
                throw res.error;
            console.log(res);
        });
    }

    IsExists(titleId: number, chatId: number): boolean {
        var result = sqlite.run(`select * from ReadedTitles where TitleId=${titleId} and ChatId=${chatId}`);
        return result.length == 0 ? false : true;
    }

    UpdateLastChapter(titleId: number, chatId: number, lastChapter: number) {
        sqlite.run(`Update ReadedTitles
    set LastChapter = ${lastChapter}
    where TitleId = ${titleId} and ChatId = ${chatId}`);
    }

    RemoveTitleById(titleId: number, chatId: number) {
        return sqlite.delete('ReadedTitles', { TitleId: titleId, Chatid: chatId });
    }
}