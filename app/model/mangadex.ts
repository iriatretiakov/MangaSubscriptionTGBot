export interface MangadexManga {
    id: string;
    title: NameAttribute;
    altTitles: NameAttribute[];
    description: DescriptionAttribute;
    originalLanguage: string;
    lastVolume: string;
    lastChapter: string;
    status: string;
}

export interface NameAttribute {
    en: string;
}

export interface DescriptionAttribute {
    en: string;
    ru: string;
}

export interface Chapter {
    id: string;
    volume: number;
    chapter: number;
    title: string;
    translatedLanguage: string;
}

export class SearchParameters {
    constructor(){
        this.ids = [];
        this.limit = 1;
        this.manga = '';
        this.order = new ChapterOrder();
        this.translatedLanguage = [];
        this.chapter = [];
    }
    ids: string[];
    limit: number;
    manga: string;
    order: ChapterOrder;
    translatedLanguage: string[];
    chapter: string[];
}

export class ChapterOrder {
    constructor() {
        this.chapter = '';
    }
    chapter: string;
}
