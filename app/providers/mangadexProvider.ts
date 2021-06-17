import MangadexModel from "mangadex-full-api";
import { Chapter, MangadexManga, SearchParameters } from "../model/mangadex";
import { ReadedTitles } from "../model/title";
const api = require("mangadex-full-api");

export class MangadexApiService {
    
    constructor(){
    }

    GetUpdated(subscription: ReadedTitles, chapters: Chapter[]): Chapter | null {
        var newChater = chapters
            .find(x =>
                (x.translatedLanguage == 'gb' || x.translatedLanguage == 'ru') &&
                +x.chapter > subscription.LastChapter);
        return newChater ? newChater : null;
    }

    async GetMangaById(titleId: string): Promise<MangadexManga> {
            var serchParameters = this.getSerchPararameters(titleId);
            var manga = await api.Manga.getByQuery(serchParameters);
            await this.GetChapters(manga);
            return manga;
    }

    async GetChapters(manga: any){
        let chapters = await manga.getFeed({ translatedLanguage: ['en', 'ru'] }) as Chapter[];
        console.log('chapters - ', chapters.find(x => x.chapter === +(manga as MangadexManga).lastChapter));
    }

    async GetMangaIdByName(titleName: string): Promise<string> {
        var manga = await api.Manga.getByQuery(titleName) as MangadexManga;
        return manga.id
    }

    private getSerchPararameters(titleId: string): SearchParameters {
        var sPrameters = new SearchParameters();
        sPrameters.ids.push(titleId);
        return sPrameters;
    }
}