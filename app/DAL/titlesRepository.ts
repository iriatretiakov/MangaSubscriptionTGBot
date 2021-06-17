import { ReadedTitles } from "../model/title";

const sqlite = require('sqlite-sync');

export class TitleRepository {
    constructor() {
        sqlite.connect('data/data.db');

        sqlite.run(`ALTER TABLE ReadedTitles RENAME TO ReadedTitlesBuf;

        CREATE TABLE IF NOT EXISTS ReadedTitles(Id  INTEGER PRIMARY KEY AUTOINCREMENT, 
        TitleId varchar(36) not null,
        TitleName varchar(255) null,
        LastChapter float not null,
        ChatId integer not null,
        LastUpdateAt DATETIME null);
        
        INSERT INTO ReadedTitles(TitleId, TitleName, LastChapter, ChatId)
        SELECT TitleId, TitleName, LastChapter, ChatId FROM ReadedTitlesBuf;
        
        DROP TABLE ReadedTitlesBuf;`, function (res: { error: any; }) {
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

    AddTitle(titleId: number, titleName: string, lastReadedChapter: number, chatId: number) {
        console.log('title name', titleName);
        sqlite.insert('ReadedTitles', { TitleId: titleId, TitleName: titleName, LastChapter: lastReadedChapter, ChatId: chatId }, function (res: { error: any; }) {
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

    GetTitlesNameByChatId(chatId: number): ReadedTitles[] {
        var result = sqlite.run(`select * from ReadedTitles where  ChatId=${chatId}`);
        return result;
    }

    UpdateTitleId(value: ReadedTitles) {
        console.log('updated title id', value.TitleId);
        sqlite.run(`Update ReadedTitles
        set TitleId = '${value.TitleId}', LastUpdateAt = '${value.LastUpdatedAt}'
        where Id = ${value.Id}`);
    }
}