function anime365API(path, options = {}) {

  return new Promise((resolve, reject) => {
    const url = 'https://smotret-anime-365.ru/api' + path;
    let headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Play Shikimori; Browser extension; https://github.com/cawa-93/play-shikimori"
    };

    options.headers = headers;
    options.credentials = 'include';

    chrome.runtime.sendMessage({
      contentScriptQuery: 'fetchUrl',
      url,
      options,
    },
      ({ response, error }) => {
        if (error) {
          return reject(error)
        }

        resolve(response);
      });


  })
}

async function shikimoriAPI(path, options = {}) {
  let domain = sessionStorage.getItem('shiki-domain');
  if (!domain) {
    domain = await getShikiDomain();
    sessionStorage.setItem('shiki-domain', domain);
  }
  const url = `https://${domain}/api${path}`;
  return callAPI(url, options)
}

async function getShikiDomain() {
  let domain = 'shikimori.one';
  try {
    const resp = await callAPI('https://shikimori.org/api/users/whoami');
    if (resp && resp.id) {
      domain = 'shikimori.org';
    }
  } catch (e) { }

  return domain
}

function callAPI(fullURL, options = {}) {
  return new Promise((resolve, reject) => {

    let headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Play Shikimori; Browser extension; https://github.com/cawa-93/play-shikimori"
    };

    options.headers = headers;
    options.credentials = 'include';

    chrome.runtime.sendMessage({
      contentScriptQuery: 'fetchUrl',
      url: fullURL,
      options,
    },
      ({ response, error }) => {
        if (error) {
          return reject(error)
        }

        resolve(response);
      });


  })
}

// Запуск главной функции
const mainObserver = new MutationObserver(main);
const observerConfig = { attributes: true, subtree: true, childList: true };
mainObserver.observe(document, observerConfig);
main();


async function main() {
	const infoSection = document.querySelector('body#animes_show .c-info-right');
	/** @type {HTMLAnchorElement} */
	let WatchOnlineButton = document.querySelector('#watch-online-button');

	if (!infoSection || WatchOnlineButton) return

	// Создание кнопки для перехода к плееру
	const WatchButtonSection = document.createElement('section');
	WatchButtonSection.classList.add('block');
	WatchButtonSection.classList.add('watch-online-block');
	WatchButtonSection.innerHTML = `
		<div class="subheadline m10">Онлайн просмотр</div>
		<a href="#" id="watch-online-button" class="b-link_button dark b-ajax"><!-- Неразрывный пробел--> <!-- /Неразрывный пробел--></a>
		<p style="color:#7b8084;text-align:center">Все новости и предложения в клубе<br><strong><a href="/clubs/2372">Play Шикимори Online</a></strong></p>
		`;
	infoSection.appendChild(WatchButtonSection);
	WatchOnlineButton = WatchButtonSection.querySelector('#watch-online-button');

	// Загрузка метаданных аниме
	const anime = await getAnime();

	if (!anime) {
		WatchOnlineButton.textContent = 'Нет видео';
		WatchOnlineButton.classList.remove('b-ajax');
		return
	}

	// 
	const { data } = await anime365API(`/series/?myAnimeListId=${anime.myanimelist_id}`);
	const series = data[0];

	if (series && series.episodes && series.episodes.length) {
		if (!anime.user_rate || anime.user_rate.episodes === 0) {
			WatchOnlineButton.textContent = 'Начать просмотр';
		} else if (anime.user_rate.episodes >= anime.episodes) {
			WatchOnlineButton.textContent = 'Пересмотреть';
		} else {
			WatchOnlineButton.textContent = 'Продолжить просмотр';
		}

		const playerURL = new URL(chrome.runtime.getURL(`player/index.html`));
		playerURL.searchParams.append('series', series.id);
		playerURL.searchParams.append('anime', anime.id);

		WatchOnlineButton.href = playerURL.toString();
	} else {
		WatchOnlineButton.textContent = 'Нет видео';
	}

	WatchOnlineButton.classList.remove('b-ajax');

}



async function getAnime() {
	const idMatch = location.pathname.match(/animes\/[^\d]*(\d+)-/);
	if (!idMatch || !idMatch[1]) {
		return undefined
	}

	const data = await shikimoriAPI(`/animes/${idMatch[1]}`);

	return data
}
