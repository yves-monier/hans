
// Credits https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
export function  (html) {
    return html.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function escapeRegexp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}