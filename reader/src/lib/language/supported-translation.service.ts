import { chunk } from 'lodash'

export interface SupportedTranslation {
    label: string
    code: string
}

export class SupportedTranslationService {
    public static SupportedTranslations: SupportedTranslation[] = chunk(
        [
            'Afrikaans',
            'af',
            'Arabic',
            'ar',
            'Assamese',
            'as',
            'Bangla',
            'bn',
            'Bosnian(Latin)',
            'bs',
            'Bulgarian',
            'bg',
            'Cantonese(Traditional)',
            'yue',
            'Catalan',
            'ca',
            'Chinese Simplified',
            'zh-Hans',
            'Chinese Traditional',
            'zh-Hant',
            'Croatian',
            'hr',
            'Czech',
            'cs',
            'Dari',
            'prs',
            'Danish',
            'da',
            'Dutch',
            'nl',
            'English',
            'en',
            'Estonian',
            'et',
            'Fijian',
            'fj',
            'Filipino',
            'fil',
            'Finnish',
            'fi',
            'French',
            'fr',
            'French (Canada)',
            'fr-ca',
            'German',
            'de',
            'Greek',
            'el',
            'Gujarati',
            'gu',
            'Haitian Creole',
            'ht',
            'Hebrew',
            'he',
            'Hindi',
            'hi',
            'Hmong Daw',
            'mww',
            'Hungarian',
            'hu',
            'Icelandic',
            'is',
            'Indonesian',
            'id',
            'Irish',
            'ga',
            'Italian',
            'it',
            'Japanese',
            'ja',
            'Kannada',
            'kn',
            'Kazakh',
            'kk',
            'Klingon',
            'tlh-Latn',
            'Klingon (plqaD)',
            'tlh-Piqd',
            'Korean',
            'ko',
            'Kurdish (Central)',
            'ku',
            'Kurdish (Northern)',
            'kmr',
            'Latvian',
            'lv',
            'Lithuanian',
            'lt',
            'Malagasy',
            'mg',
            'Malay',
            'ms',
            'Malayalam',
            'ml',
            'Maltese',
            'mt',
            'Maori',
            'mi',
            'Marathi',
            'mr',
            'Norwegian',
            'nb',
            'Odia',
            'or',
            'Pashto',
            'ps',
            'Persian',
            'fa',
            'Polish',
            'pl',
            'Portuguese (Brazil)',
            'pt-br',
            'Portuguese (Portugal)',
            'pt-pt',
            'Punjabi',
            'pa',
            'Queretaro Otomi',
            'otq',
            'Romanian',
            'ro',
            'Russian',
            'ru',
            'Samoan',
            'sm',
            'Serbian (Cyrillic)',
            'sr-Cyrl',
            'Serbian (Latin)',
            'sr-Latn',
            'Slovak',
            'sk',
            'Slovenian',
            'sl',
            'Spanish',
            'es',
            'Swahili',
            'sw',
            'Swedish',
            'sv',
            'Tahitian',
            'ty',
            'Tamil',
            'ta',
            'Telugu',
            'te',
            'Thai',
            'th',
            'Tongan',
            'to',
            'Turkish',
            'tr',
            'Ukrainian',
            'uk',
            'Urdu',
            'ur',
            'Vietnamese',
            'vi',
            'Welsh',
            'cy',
            'Yucatec Maya',
            'yua',
        ],
        2,
    ).map(([label, code]) => ({ label, code }))
}
