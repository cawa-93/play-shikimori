import Vue from "../vue.esm.browser.js";

export const namespaced = true

export const state = {
  series: null,
  currentEpisodeID: null,
}

export const getters = {
  episodes(state) {
    return state.series && state.series.episodes ? state.series.episodes : []
  },

  currentEpisode(state, getters) {
    if (!state.currentEpisodeID) return undefined
    return getters.episodes.find(episode => episode.id === state.currentEpisodeID)
  }
}


export const mutations = {

  setSeries(state, series) {
    state.series = series
  },

  setCurrentEpisode(state, playload) {
    state.currentEpisodeID = playload
  },

  setTranslations(state, { episodeID, translations }) {
    const episode = state.series.episodes.find(episode => episode.id === episodeID)
    Vue.set(episode, 'translations', translations)

  }
}


export const actions = {
  async initSeries({ state, commit }, seriesID) {
    if (!state.series) {
      const { data } = await window.api.anime365(`/series/${seriesID}`)
      commit('setSeries', data)
    }
  },

  async setCurrentEpisode({ state, commit, getters }, episodeID) {
    commit('setCurrentEpisode', episodeID)

    if (!getters.currentEpisode.translations) {
      const { data } = await window.api.anime365(`/episodes/${getters.currentEpisode.id}`)
      commit('setTranslations', { episodeID, translations: data.translations })

    }
  }
}