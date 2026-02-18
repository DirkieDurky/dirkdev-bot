import path from 'path';
import { fileURLToPath } from 'url';

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const dateFormatter = new Intl.DateTimeFormat("nl-NL", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
    hour12: false
});

const dateFormatterTime = new Intl.DateTimeFormat("nl-NL", {
    timeZone: "Europe/Amsterdam",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
});

const dateFormatterShort = new Intl.DateTimeFormat("nl-NL", {
    timeZone: "Europe/Amsterdam",
    dateStyle: "long",
});

export function formatDate(date) {
    return dateFormatter.format(date).replaceAll(", ", " ");
}

export function formatDateTime(date) {
    return dateFormatterTime.format(date).replaceAll(", ", " ");
}

export function formatDateShort(date) {
    return dateFormatterShort.format(date).replaceAll(", ", " ");
}

export function dirname() { return path.dirname(fileURLToPath(import.meta.url)); }

const months = ["jan", "feb", "maa", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

export const dateRegex = new RegExp(`\\d{1,2} (${months.join("|")})`, "g");

export function parseDate(date) {
    const now = new Date();
    const currentYear = now.getFullYear();

    const split = date.split(' ');
    const month = months.indexOf(split[1]);
    let year = currentYear;
    if (month < now.getMonth()) {
        year++;
    }
    const day = split[0];
    return new Date(year, month, day);
};

export const sessionRegex = new RegExp(`(\\d{1,2}) (${months.join("|")})\\w*(?: van(?:af))? (\\d{1,2})(?::(\\d{1,2}))?(?: uur)?(?: tot(?: en met))? (\\d{1,2})(?::(\\d{1,2}))?(?: uur)?`, "g");

export function parseSession(dateStr) {
    const matches = sessionRegex.exec(dateStr);

    const now = new Date();
    const currentYear = now.getFullYear();

    const month = months.indexOf(matches[2]);
    let year = currentYear;
    if (month < now.getMonth()) {
        year++;
    }
    const day = matches[1];
    const date = new Date(year, month, day);

    const startDateTime = new Date(date.getTime());
    startDateTime.setHours(matches[3]);
    startDateTime.setMinutes(matches[4] ?? 0);

    const endDateTime = new Date(date.getTime());
    endDateTime.setHours(matches[5]);
    endDateTime.setMinutes(matches[6] ?? 0);

    return [startDateTime, endDateTime];
};

export function parseSingleDate(date, mayBeSession = false) {
    if (mayBeSession) {
        const sessionStrings = date.match(sessionRegex);

        if (sessionStrings !== null) {
            if (sessionStrings.length > 1) {
                console.log(formatDate(new Date()), "|", "Multiple dates found. One is expected per parameter");
                return;
            }
            return [true, parseSession(sessionStrings[0])];
        }
    }

    const dateStrings = date.match(dateRegex);

    if (dateStrings === null) {
        console.log(formatDate(new Date()), "|", "No dates found.");
        return;
    }
    if (dateStrings.length > 1) {
        console.log(formatDate(new Date()), "|", "Multiple dates found. One is expected per parameter");
        return;
    }

    if (mayBeSession) {
        return [false, parseDate(dateStrings[0])];
    } else {
        return parseDate(dateStrings[0]);
    }
}
