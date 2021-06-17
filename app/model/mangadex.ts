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
    }
    ids:string[];
}