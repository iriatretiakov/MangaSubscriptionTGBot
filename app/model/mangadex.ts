export interface MangadexManga {
    manga: Manga;
    chapter: Chapter[];
}

export interface Manga {
    cover_url: string;
    description: string;
    title: string;
    artist: string;
    author: string;
    covers: string[];
}

export interface Chapter {
    id: number;
    lang_name: string;
    volume: string;
    chapter: string;
    title: string;
    lang_code: string;
}