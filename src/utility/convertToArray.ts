export const convertToArray = (commaSeparatedString: string): string[] => {
    if (commaSeparatedString === '') {
        return [];
    }
    return commaSeparatedString.split(',').map(item => item.trim());
}  