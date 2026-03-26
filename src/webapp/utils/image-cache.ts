import _ from "lodash";

export const cacheImages = (contents: string) => {
    const images = extractImageUrls(contents);
    for (const image of images) {
        const container = new Image();
        container.src = image;
    }
};

export const extractImageUrls = (contents: string): string[] => {
    return [...extractMarkdownImages(contents), ...extractHTMLImages(contents)];
};

const extractMarkdownImages = (contents: string): string[] => {
    // Avoid named capture groups for broader TS target compatibility.
    const regex = /!\[[^\]]*\]\((.*?)\s*(?="|\))(".*")?\)/g;
    return _(Array.from(contents.matchAll(regex)))
        .map(match => match[1])
        .compact()
        .uniq()
        .value();
};

const extractHTMLImages = (contents: string): string[] => {
    const regex = /src\s*=\s*"(.+?)"/g;
    return _(Array.from(contents.matchAll(regex)))
        .map(match => match[1])
        .compact()
        .uniq()
        .value();
};
