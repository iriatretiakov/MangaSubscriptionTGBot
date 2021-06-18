import MangadexModel from "mangadex-full-api";
import { Chapter, MangadexManga, SearchParameters } from "../model/mangadex";
import { ReadedTitles } from "../model/title";
const api = require("mangadex-full-api");

export class MangadexApiService {
    
    constructor(){
    }

    async GetUpdated(subscription: ReadedTitles): Promise<Chapter | undefined> {
        var chapter = await this.GetChapter(subscription);
        return chapter ? chapter : undefined;
    }

    async GetMangaById(titleId: string): Promise<MangadexManga> {
        var serchParameters = this.getSerchPararameters(titleId);
        var manga = await api.Manga.getByQuery(serchParameters);
        return manga;
    }

    async GetChapter(subscription: ReadedTitles): Promise<Chapter | undefined>{
        try {
            var params = this.getSerchPararametersForChapters(subscription)
            var chapter = await api.Chapter.getByQuery(params);
            return chapter;
        }
        catch {
            return undefined;
        }
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

    private getSerchPararametersForChapters(subscription: ReadedTitles): SearchParameters {
        var sPrameters = new SearchParameters();
        sPrameters.manga = subscription.TitleId;
        sPrameters.limit = 1;
        sPrameters.order.chapter = 'asc';
        sPrameters.translatedLanguage.push('en');
        sPrameters.translatedLanguage.push('ru');
        sPrameters.chapter.push((subscription.LastChapter+1).toString());
        return sPrameters;
    }
}