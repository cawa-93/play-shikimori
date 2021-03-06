import {SelectedTranslation} from '../../types/UI';
import {clearString} from './clear-string';


export function clearAuthorSummary(authorsSummary: string) {
    return clearString(authorsSummary.replace(/\(.*\)/g, ''));
}


/**
 *
 * @param {Map<number, anime365.Translation>} translations
 */
export function getAuthorsPriority(translations: Map<number, SelectedTranslation>) {
    const authors = new Map();

    translations.forEach((transaction) => {
        if (!transaction || !transaction.author) {
            return;
        }

        const authorsSummary = clearAuthorSummary(transaction.author);

        if (!authorsSummary) {
            return;
        }

        if (!authors.has(authorsSummary)) {
            authors.set(authorsSummary, 0);
        }

        authors.set(authorsSummary, authors.get(authorsSummary) + 1);
    });

    authors.forEach((count, author) => {
        authors.set(author, count / translations.size);
    });

    return authors;
}


/**
 *
 * @param {Map<number, anime365.Translation>} translations
 */
export function getTypesPriority(translations: Map<number, SelectedTranslation>) {
    const types = new Map();

    translations.forEach((transaction) => {
        if (!transaction || !transaction.type) {
            return;
        }

        if (!types.has(transaction.type)) {
            types.set(transaction.type, 0);
        }

        types.set(transaction.type, types.get(transaction.type) + 1);
    });

    types.forEach((count, t) => {
        types.set(t, count / translations.size);
    });

    return types;
}


/**
 *
 * @param {anime365.Translation[]} translations
 * @param {string} authorsSummaryRaw
 * @param {string} type
 */
export function filterTranslationsByAuthor(
    translations: anime365.Translation[],
    authorsSummaryRaw: string,
    type?: string,
) {
    const authorsSummary = clearAuthorSummary(authorsSummaryRaw);
    if (!authorsSummary) {
        return [];
    }

    return translations.filter((translation) => {
        const summary = clearAuthorSummary(translation.authorsSummary);

        return summary &&
            (
                authorsSummary.indexOf(summary) >= 0 || summary.indexOf(authorsSummary) >= 0
            )
            && (
                !type || type === translation.type
            );

    });
}


/**
 *
 * @param {anime365.Translation[]} translations
 */
export function getMostPriorityTranslation(translations: anime365.Translation[]) {
    if (!translations || !translations.length) {
        return null;
    }
    let maxPriority = 0;
    let maxPriorityTranslation = translations[0];

    for (const t of translations) {
        if (t.priority > maxPriority) {
            maxPriority = t.priority;
            maxPriorityTranslation = t;
        }
    }

    return maxPriorityTranslation;
}


/**
 *
 * @param {Map<number, anime365.Translation>} history
 * @param {anime365.Episode} episode
 */
export function getPriorityTranslationForEpisode(
    history: Map<number, SelectedTranslation>,
    episode: anime365.Episode,
) {

    if (!episode || !episode.translations || !episode.translations.length) {
        return [];
    }

    // Выбираем перевод используемый для предыдущих серий
    const previousUserTranslation = history.get(episode.seriesId);

    const previousUserTranslationAuthor = previousUserTranslation ? previousUserTranslation.author : undefined;
    const previousUserTranslationType = previousUserTranslation ? previousUserTranslation.type : undefined;
    if (previousUserTranslationAuthor && previousUserTranslationType) {
        // Поиск перевода от того же автора
        const priorityTranslations = filterTranslationsByAuthor(
            episode.translations,
            previousUserTranslationAuthor,
            previousUserTranslationType,
        );

        // Если для текущей серии найден перевод того же автора что сохранен в истории — возвращаем
        if (priorityTranslations.length) {
            return priorityTranslations;
        }
    }

    // Карта авторов и их индекс популярности
    const authorPriorityMap = [...getAuthorsPriority(history)]
    // Не учитываем авторов которые используються реже чем в 10% случаев
        .filter(([, rating]) => rating >= 0.1)
        // Сортируем всех авторов в порядке популярности
        .sort(([, rating1], [, rating2]) => rating2 - rating1);


    // Перебираем всех авторов в порядке популярности
    for (const [author] of authorPriorityMap) {
        const filtered = filterTranslationsByAuthor(episode.translations, author, previousUserTranslationType);

        // Если перевод от одного из популярных авторов найден — вернуть его
        if (filtered && filtered.length) {
            return filtered;
        }
    }

    // Поиск перевода от того же типа что и сохраненный
    if (previousUserTranslationType) {
        const priorityTranslations = episode.translations.filter((t) => t.type === previousUserTranslationType);

        // Если для текущей серии найден перевод того же типа что сохранен в истории — возвращаем
        if (priorityTranslations.length) {
            return priorityTranslations;
        }
    }

    // Карта типов переводов и их индекс популярности
    const typePriorityMap = [...getTypesPriority(history)]
    // Не учитываем типы которые используються реже чем в 10% случаев
        .filter(([, rating]) => rating >= 0.1)
        // Сортируем все типы в порядке популярности
        .sort(([, rating1], [, rating2]) => rating2 - rating1);

    // Перебираем все типы в порядке популярности
    for (const [type] of typePriorityMap) {
        const filtered = episode.translations.filter((t) => t.type === type);

        // Если перевод одного из популярных типов найден — вернуть его
        if (filtered && filtered.length) {
            return filtered;
        }
    }

    return episode.translations;
}
