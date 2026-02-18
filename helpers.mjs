import path from 'path';
import { fileURLToPath } from 'url';

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const dateFormatter = new Intl.DateTimeFormat("en-US", {
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

export function formatDate(date) {
    return dateFormatter.format(date).replaceAll(", ", " ");
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

export function parseSingleDate(date) {
    const dateStrings = date.match(dateRegex);

    if (dateStrings === null) {
        console.log(formatDate(new Date()), "|", "No dates found.");
        return;
    }
    if (dateStrings.length > 1) {
        console.log(formatDate(new Date()), "|", "Multiple dates found. One is expected per parameter");
        return;
    }

    return parseDate(dateStrings[0]);
}
