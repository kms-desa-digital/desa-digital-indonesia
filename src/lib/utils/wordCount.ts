export function countWords(text: string | null | undefined): number {
    if (!text) return 0;
    return text.toString().trim().split(/\s+/).filter(word => word !== "").length;
}

export function validateWordLimit(text: string | null | undefined, limit: number, fieldName: string) {
    if (countWords(text) > limit) {
        throw new Error(`Maksimal ${limit} kata untuk ${fieldName}.`);
    }
}
