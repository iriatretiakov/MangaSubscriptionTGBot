import { ReadedTitles } from "../model/title";

var mysql      = require('mysql');
export class TitleRepository {
    
    readonly DBPath: string = "data/data.db";
    constructor() {
       
    }

    connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : 'taikutsu',
        database : 'mangadex',
        port: 3306
      });

    // connection = mysql.createPool(process.env.CLEARDB_DATABASE_URL);

//         this.connection.query(`
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

    InitTable() {
        try {
            this.connection.query(`
            CREATE TABLE IF NOT EXISTS ReadedTitles (
                Id				INTEGER NOT NULL AUTO_INCREMENT,
                TitleId			VARCHAR(36) NOT NULL,
                TitleName		Varchar(255),
                LastChapter		REAL NOT NULL,
                ChatId			INTEGER NOT NULL,
                LastUpdateAt	TEXT,
                PRIMARY KEY (Id)); `, function (error: any, results: any, fields: any) {
                    if (error) throw error;
                  });
        }
        catch(e) {
            console.log('ERROR: ', e);
        }
        finally {
        }
    }

    GetReadedTitles(): Promise<ReadedTitles[]> {
        try {
            console.log('GetReadedTitles')
            var self = this;
            return new Promise((resolve, reject) => {
                this.connection.query(`select * from ReadedTitles`, function (error: any, results: any, fields: any) {
                    self.connection.release;
                    console.log('results', results);
                    if (error) {
                        reject(error);
                    };
                    resolve(results);
                });
            });
        }
        finally {
        }
    }

    GetReadedTitlesByChatId(chatId: number): Promise<ReadedTitles[]> {
        try {
            console.log('GetReadedTitlesByChatId')
            var self = this;
            return new Promise((resolve, reject) => {
                this.connection.query(`select * from ReadedTitles where ChatId=${chatId}`, function (error: any, results: any, fields: any) {
                    self.connection.release;
                    console.log('results', results);
                    if (error) {
                        reject(error);
                    };
                    resolve(results);
                });
            });
        }
        finally {
        }
    }

    AddTitle(titleId: string, titleName: string, lastReadedChapter: number, chatId: number) {
        console.log(`Add title with id - ${titleId} and name ${titleName}`);

        try {
            var self = this;
            var title  = {TitleId: titleId, TitleName: titleName, LastChapter: lastReadedChapter, ChatId: chatId, LastUpdateAt:new Date().toString()};
            this.connection.query('INSERT INTO ReadedTitles SET ?', title, function (error: any, results: any, fields: any) {
                self.connection.release;
                if (error){
                    throw error;}
              });
        }
        catch(e){
            console.log('ERROR:', e);
        }
        finally {
        }
        
    }

    IsExists(titleId: string, chatId: number): Promise<boolean> {
        try {
            console.log('IsExists');
            var self = this;
            return new Promise((resolve) => {
            this.connection.query(`select * from ReadedTitles where TitleId='${titleId}' and ChatId=${chatId}`, function (error: any, results: any, fields: any) {
                self.connection.release;
                if (error) throw error;
                results.length == 0 ? resolve(false) : resolve(true);
              }); 
        });
        }
        finally {
        }
    }

    UpdateLastChapter(titleId: string, chatId: number, lastChapter: number) {
        try {
            var self = this;
            this.connection.query(`Update ReadedTitles
                set LastChapter = ${lastChapter}, LastUpdateAt = '${new Date()}'
                where TitleId = '${titleId}' and ChatId = ${chatId}`, function (error: any, results: any, fields: any) {
                self.connection.release;

                if (error) {
                    throw error
                }
            });
        }
        finally {
        }
    }

    RemoveTitleById(titleId: string, chatId: number) {
        try {
            var self = this;
            return this.connection.query(`DELETE FROM ReadedTitles WHERE TitleId = '${titleId}' and ChatId = ${chatId}`,
                function (error: any, results: any, fields: any) {
                    self.connection.release;
                    if (error) {
                        throw error
                    }
                });
        }
        finally {
        }
    }

    GetTitlesNameByChatId(chatId: number): Promise<ReadedTitles[]> {
        try {
            var self = this;
            return new Promise((resolve, reject) => { 
                this.connection.query(`select * from ReadedTitles where  ChatId=${chatId}`, function (error: any, results: any, fields: any) {
                    self.connection.release;
                    if (error) {
                        reject(error);
                    };
                    resolve(results);
                });
            });
        }
        finally {
        }
    }

    UpdateTitleId(value: ReadedTitles) {
        console.log(`update title with id - ${value.Id} and name ${value.TitleName} and LastUpdateAt - ${value.LastUpdatedAt}`);
        try {
            this.connection.query(`Update ReadedTitles
                set TitleId = '${value.TitleId}', LastUpdateAt = '${value.LastUpdatedAt}'
                where Id = ${value.Id}`);
        }
        finally {
        }
        
    }

}