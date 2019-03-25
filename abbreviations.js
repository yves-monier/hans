
let abbreviations = [
    { "abbr": "acc", "is": "þolfall", "en": "accusative" },
    { "abbr": "adj", "is": "lýsingarorð", "en": "adjective" },
    { "abbr": "adj comp", "is": "lýsingarorð í miðstigi", "en": "comparative adjective" },
    { "abbr": "adj (dat)", "is": "lýsingarorð sem tekur með sér þágufall", "en": "adjective that governs the dative case" },
    { "abbr": "adj indecl", "is": "óbeygjanlegt lýsingarorð", "en": "indeclinable adjective" },
    { "abbr": "adj n", "is": "lýsingarorð í hvorugkyni", "en": "neuter adjective" },
    { "abbr": "adj pl", "is": "lýsingarorð í fleirtölu", "en": "plural adjective" },
    { "abbr": "adj superl", "is": "lýsingarorð í efstastigi", "en": "superlative adjective" },
    { "abbr": "adv", "is": "atviksorð", "en": "adverb" },
    { "abbr": "adv comp", "is": "atviksorð í miðstigi", "en": "comparative adverb" },
    { "abbr": "adv superl", "is": "atviksorð í efstastigi", "en": "superlative adverb" },
    { "abbr": "comp", "is": "miðstig", "en": "comparative" },
    { "abbr": "conj", "is": "samtenging", "en": "conjunction" },
    { "abbr": "dat", "is": "þágufall", "en": "dative" },
    { "abbr": "dat+acc", "is": "er merki við sögn sem tekur með sér andlag í þágufalli og þolfalli", "en": "indicates a verb with dative + accusative objects" },
    { "abbr": "e-a", "is": "einhverja", "en": "somebody (feminine)" },
    { "abbr": "e-ð", "is": "eitthvað", "en": "something" },
    { "abbr": "e-n", "is": "einhvern", "en": "somebody (masculine)" },
    { "abbr": "e-m", "is": "einhverjum", "en": "somebody" },
    { "abbr": "e-s", "is": "einhvers", "en": "somebody's" },
    { "abbr": "e-u", "is": "einhverju", "en": "something" },
    { "abbr": "esp", "is": "einkum", "en": "especially" },
    { "abbr": "f", "is": "kvenkyn/nafnorð í kvenkyni", "en": "feminine/feminine noun" },
    { "abbr": "f indecl", "is": "óbeygjanlegt nafnorð í kvenkyni", "en": "indeclinable feminine noun" },
    { "abbr": "f pl", "is": "fleirtölunafnorð í kvenkyni", "en": "feminine plural noun" },
    { "abbr": "gen", "is": "eignarfall", "en": "genitive" },
    { "abbr": "impers", "is": "ópersónuleg notkun", "en": "impersonal usage" },
    { "abbr": "indic", "is": "framsöguháttur", "en": "indicative" },
    { "abbr": "interj", "is": "upphrópun", "en": "interjection" },
    { "abbr": "m", "is": "karlkyn/nafnorð í karlkyni", "en": "masculine/masculine noun" },
    { "abbr": "málfr", "is": "málfræði", "en": "grammar" },
    { "abbr": "m pl", "is": "fleirtölunafnorð í karlkyni", "en": "masculine plural noun" },
    { "abbr": "n", "is": "hvorugkyn/nafnorð í hvorugkyni", "en": "neuter/neuter noun" },
    { "abbr": "n indecl", "is": "óbeygjanlegt nafnorð", "en": "indeclinable neuter noun" },
    { "abbr": "n pl", "is": "fleirtölunafnorð í hvorugkyni", "en": "neuter plural noun" },
    { "abbr": "num", "is": "töluorð", "en": "numeral" },
    { "abbr": "ofl", "is": "og fleira", "en": "and others" },
    { "abbr": "pers", "is": "persóna", "en": "person" },
    { "abbr": "pl", "is": "fleirtala", "en": "plural" },
    { "abbr": "poet", "is": "skáldskaparmál", "en": "poetical/archaic" },
    { "abbr": "pp", "is": "lýsingarháttur þátíðar", "en": "past participle" },
    { "abbr": "prep", "is": "forsetning", "en": "preposition" },
    { "abbr": "prep (acc)", "is": "forsetning sem stýrir þolfalli", "en": "preposition that governs the accusative case" },
    { "abbr": "prep (dat)", "is": "forsetning sem stýrir þágufalli", "en": "preposition that governs the dative case" },
    { "abbr": "prep (gen)", "is": "forsetning sem stýrir eignarfalli", "en": "preposition that governs the genitive case" },
    { "abbr": "pron", "is": "fornafn", "en": "pronoun" },
    { "abbr": "pron demon", "is": "ábendingarfornafn", "en": "demonstrative pronoun" },
    { "abbr": "pron indef", "is": "óákveðið fornafn", "en": "indefinite pronoun" },
    { "abbr": "pron pl", "is": "fornafn í fleirtölu", "en": "pronoun plural" },
    { "abbr": "pron poss", "is": "eignarfornafn", "en": "possessive pronoun" },
    { "abbr": "pron refl", "is": "afturbeygt fornafn", "en": "reflexive pronoun" },
    { "abbr": "prp", "is": "lýsingarháttur nútíðar", "en": "present participle" },
    { "abbr": "refl", "is": "miðmynd", "en": "reflexive, middle voice" },
    { "abbr": "rel", "is": "tilvísunarorð", "en": "relative" },
    { "abbr": "sby", "is": "einhver", "en": "somebody" },
    { "abbr": "sby's", "is": "einhvers/einhverrar", "en": "somebody's" },
    { "abbr": "sg", "is": "eintala", "en": "singular" },
    { "abbr": "skammst", "is": "skammstöfun", "en": "abbreviation" },
    { "abbr": "sth", "is": "eitthvað", "en": "something" },
    { "abbr": "stærðfr", "is": "stærðfræði", "en": "mathematics" },
    { "abbr": "UK", "is": "bresk stafsetning eða málnotkun", "en": "British spelling or usage" },
    { "abbr": "US", "is": "norðuramerísk stafsetning eða málnotkun", "en": "N. American spelling or usage" },
    { "abbr": "v aux", "is": "hjálparsögn", "en": "auxiliary verb" },
    { "abbr": "v impers", "is": "ópersónuleg sögn", "en": "impersonal verb" },
    { "abbr": "v refl", "is": "miðmyndarsögn", "en": "reflexive verb" }
]

let init = false;

function escapeRegexp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// Credits https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
export function desabbreviate(html) {
    if (!init) {
        for (a in abbreviations) {
            let regex = new RegExp('\\b' + escapeRegexp(a.abbr) + '\\b', 'g');
            a.rx = regex;
        }
        init = true;
    }

    for (a in abbreviations) {
        html = html.replace(a.rx, a.is);
        a.rx = regex;
    }
    return html;
}
