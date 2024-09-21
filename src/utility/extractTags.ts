export const extractTags = (inputText: string): string[] => {

    const matches = inputText.match(/#([\w\u0600-\u06FF]+)/g);

    return matches ? matches.map(word => word.substring(1)) : [];
}