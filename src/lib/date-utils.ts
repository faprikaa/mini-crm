export function parseDateStart(value: string | undefined): Date | null {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function parseDateEnd(value: string | undefined): Date | null {
    if (!value) return null;
    const date = new Date(`${value}T23:59:59.999Z`);
    return Number.isNaN(date.getTime()) ? null : date;
}
