import { ReadedTitles } from "../model/title";

const sqlite = require('sqlite-sync');

export class TitleRepository {
    readonly DBPath: string = "data/data.db";
    constructor() {

//         sqlite.run(`
// CREATE TABLE "ReadedTitles" (
// 	"Id"	INTEGER NOT NULL,
// 	"TitleId"	VARCHAR(36) NOT NULL,
// 	"TitleName"	Varchar(255),
// 	"LastChapter"	REAL NOT NULL,
// 	"ChatId"	INTEGER NOT NULL,
// 	"LastUpdateAt"	TEXT,
// 	PRIMARY KEY("Id" AUTOINCREMENT)
// );
//  `, function (res: { error: any; }) {
//             if (res.error)
//                 throw res.error;
//             console.log(res);
//         });
    }

    InitTable() {
        try {
            sqlite.connect(this.DBPath);
            sqlite.run(`
            CREATE TABLE IF NOT EXISTS "ReadedTitles" (
                "Id"	INTEGER NOT NULL,
                "TitleId"	VARCHAR(36) NOT NULL,
                "TitleName"	Varchar(255),
                "LastChapter"	REAL NOT NULL,
                "ChatId"	INTEGER NOT NULL,
                "LastUpdateAt"	TEXT,
                PRIMARY KEY("Id" AUTOINCREMENT)
            );
             `, function (res: { error: any; }) {
                        if (res.error)
                            throw res.error;
                        console.log(res);
                    });
        }
        finally {
            sqlite.close(); 
        }
    }

    GetReadedTitles(): ReadedTitles[] {
        try {
            sqlite.connect(this.DBPath);
            return sqlite.run(`select * from ReadedTitles`);
        }
        finally {
            sqlite.close();
        }
    }

    GetReadedTitlesByChatId(chatId: number): ReadedTitles[] {
        try {
            sqlite.connect(this.DBPath);
            return sqlite.run(`select * from ReadedTitles where ChatId=${chatId}`);
        }
        finally {
            sqlite.close();
        }
    }

    GetUserId(chatId: number) {
        try {
            sqlite.connect(this.DBPath);
            return sqlite.run(`select id from UsersChat where ChatId=${chatId}`)[0];
        }
        finally {
            sqlite.close();
        }
    }

    AddTitle(titleId: string, titleName: string, lastReadedChapter: number, chatId: number) {
        console.log(`Add title with id - ${titleId} and name ${titleName}`);

        try {
            sqlite.connect(this.DBPath);
            var date = new Date().toString();
            sqlite.insert('ReadedTitles', { TitleId: titleId, TitleName: titleName, LastChapter: lastReadedChapter, ChatId: chatId, LastUpdateAt: date }, function (res: { error: any; }) {
                if (res.error)
                    throw res.error;
                console.log(res);
            });
        }
        finally {
            sqlite.close();
        }
        
    }

    IsExists(titleId: string, chatId: number): boolean {
        try {
            sqlite.connect(this.DBPath);
            var result = sqlite.run(`select * from ReadedTitles where TitleId='${titleId}' and ChatId=${chatId}`);
            return result.length == 0 ? false : true;
        }
        finally {
            sqlite.close();
        }
    }

    UpdateLastChapter(titleId: string, chatId: number, lastChapter: number) {
        try {
            console.log()
            sqlite.connect(this.DBPath);
            sqlite.run(`Update ReadedTitles
                set LastChapter = ${lastChapter}, LastUpdateAt = '${new Date()}'
                where TitleId = '${titleId}' and ChatId = ${chatId}`);
        }
        finally {
            sqlite.close();
        }
    }

    RemoveTitleById(titleId: string, chatId: number) {
        try {
            sqlite.connect(this.DBPath);
            return sqlite.delete('ReadedTitles', { TitleId: titleId, Chatid: chatId });
        }
        finally {
            sqlite.close();
        }
    }

    GetTitlesNameByChatId(chatId: number): ReadedTitles[] {
        try {
            sqlite.connect(this.DBPath);
            return sqlite.run(`select * from ReadedTitles where  ChatId=${chatId}`);
        }
        finally {
            sqlite.close();
        }
    }

    UpdateTitleId(value: ReadedTitles) {
        console.log(`update title with id - ${value.Id} and name ${value.TitleName} and LastUpdateAt - ${value.LastUpdatedAt}`);
        try {
            sqlite.connect(this.DBPath);
            sqlite.run(`Update ReadedTitles
                set TitleId = '${value.TitleId}', LastUpdateAt = '${value.LastUpdatedAt}'
                where Id = ${value.Id}`);
        }
        finally {
            sqlite.close();
        }
        
    }

}