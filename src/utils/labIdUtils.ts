export function getNextLabId(currentId: string): string {
    if (currentId.length !== 10) return currentId;
    const datePart = currentId.substring(0, 6);
    const counterPart = parseInt(currentId.substring(6));

    if (counterPart >= 9999) {
        // Ideally here we'd increment the date, but for single-day navigation 
        // we'll just wrap or stay. For now, let's just increment the number.
        return datePart + '0001';
    }

    const nextCounter = (counterPart + 1).toString().padStart(4, '0');
    return datePart + nextCounter;
}

export function getPrevLabId(currentId: string): string {
    if (currentId.length !== 10) return currentId;
    const datePart = currentId.substring(0, 6);
    const counterPart = parseInt(currentId.substring(6));

    if (counterPart <= 1) {
        return datePart + '9999';
    }

    const prevCounter = (counterPart - 1).toString().padStart(4, '0');
    return datePart + prevCounter;
}

export function getLabIdRange(startId: string, endId: string): string[] {
    if (startId.length !== 10 || endId.length !== 10) return [];
    if (startId > endId) return [];

    const range: string[] = [];
    let current = startId;

    while (current <= endId) {
        range.push(current);
        if (current === endId) break;
        current = getNextLabId(current);
        // Safety break to prevent infinite loops if logic fails
        if (range.length > 500) break;
    }

    return range;
}
