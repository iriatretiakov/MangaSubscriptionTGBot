import Mangadex from "mangadex-api";
import { Chapter, MangadexManga } from "../model/mangadex";
import { ReadedTitles } from "../model/title";

export class MangadexApiService {
    private client:Mangadex;

    constructor(){
        this.client = new Mangadex();
    }

    GetUpdated(subscription: ReadedTitles, chapters: Chapter[]): Chapter | null {
        var newChater = chapters
            .find(x =>
                (x.lang_code == 'gb' || x.lang_code == 'ru') &&
                +x.chapter > subscription.LastChapter);
        return newChater ? newChater : null;
    }

    async GetMangaById(titleId: number): Promise<MangadexManga> {
        return await this.client.getManga(titleId).then((response: any) => {
            return response;
        })
    }
}