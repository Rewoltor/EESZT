export function translateFlag(flag: string | undefined): string {
    if (!flag) return '';
    const lower = flag.toLowerCase().trim();
    if (['hi', 'high', '+', '++'].includes(lower)) return 'Magas';
    if (['lo', 'low', '-', '--'].includes(lower)) return 'Alacsony';
    return flag;
}
