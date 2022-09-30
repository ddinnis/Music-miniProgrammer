// pages/music-player/music-player.js
import { getSongDetail, getSongLyric } from "../../service/player-api";
import { parseLyric } from "../../utils/parse-lyric";
import playStore from "../../store/playStore";
import { throttle } from "underscore";

const app = getApp();
const audioContext = wx.createInnerAudioContext();
const modelNames = ["order", "repeat", "random"];
Page({
  data: {
    id: 0,
    curSong: {},
    isFirstTimePlay: true,
    // 歌词
    paddingValue: 0,
    lyricInfos: [],
    statusHeight: 20,
    contentHeight: 500,
    lyricScrollTop: "",
    curIndex: 0,
    // 播放条
    currentPage: 0,
    currentTime: 0,
    durationTime: 0,
    sliderValue: 0,
    isSliderChange: false,
    // 播放按钮
    isPlaying: true,
    // 播放列表
    playSongsList: [],
    // 0. 顺序播放 1. 单曲播放 2. 随机播放
    playSongsIndex: 0,
    // 播放模式
    playModeName: "order",
    playModeIndex: 0,
  },
  onLoad(options) {
    const id = options.id;

    this.setupPlaySong(id);
  },
  // 播放歌曲
  setupPlaySong(id) {
    this.setData({ id: id });
    this.toGetSongDetail();
    this.toGetSongLyric();
    this.setData({ contentHeight: app.globalData.contentHeight });
    // 共享数据 播发列表
    playStore.onStates(
      ["playSongsList", "playSongsIndex"],
      this.getPlaySongsInfo
    );

    audioContext.src = `https://music.163.com/song/media/outer/url?id=${id}.mp3`;
    audioContext.autoplay = true;

    // 监听播放进度
    if (this.data.isFirstTimePlay) {
      this.data.isFirstTimePlay = false;
      audioContext.onTimeUpdate(() => {
        // 没有滑动的时候
        if (!this.data.isSliderChange) {
          const sliderValue =
            (this.data.currentTime / this.data.durationTime) * 100;

          this.setData({
            currentTime: audioContext.currentTime * 1000,
            sliderValue,
          });
        }
        // 匹配歌词进度 获取歌词的索引index 和文本
        if (!this.data.lyricInfos.length) return;
        // 并保证拿到最后一句歌词
        let index = this.data.lyricInfos.length - 1;

        for (let i = 0; i < this.data.lyricInfos.length; i++) {
          // this.data 里面拿数据 500ms 更新一次
          const info = this.data.lyricInfos[i];

          if (info.time > audioContext.currentTime * 1000) {
            index = i - 1;
            break;
          }
        }
        const curLyric = this.data.lyricInfos[index].text;
        // 35是歌词的高度
        this.setData({
          curLyric: curLyric,
          lyricScrollTop: 35 * index,
          curIndex: index,
        });
      });
      audioContext.onWaiting(() => {
        audioContext.pause();
      });
      audioContext.onCanplay(() => {
        audioContext.play();
      });
      audioContext.onEnded(() => {
        this.onChangeNewSong();
      });
    }
  },
  toGetSongDetail() {
    getSongDetail(this.data.id).then((res) => {
      this.setData({ curSong: res.songs[0], durationTime: res.songs[0].dt });
    });
  },
  toGetSongLyric() {
    getSongLyric(this.data.id).then((res) => {
      const lyricString = res.lrc.lyric;
      const lyricInfos = parseLyric(lyricString);

      this.setData({ lyricInfos: lyricInfos });
    });
  },
  // 进行节流
  onSliderChange: throttle(function (event) {
    const value = event.detail.value;
    const currentTime = (value / 100) * this.data.durationTime;
    audioContext.seek(currentTime / 1000);
    this.setData({ currentTime });
  }),
  onSliderChanging(event) {
    const value = event.detail.value;
    const currentTime = (value / 100) * this.data.durationTime;
    audioContext.seek(currentTime / 1000);
    this.setData({ currentTime, isSliderChange: true });
  },
  onNavTapItemTap(event) {
    const index = event.currentTarget.dataset.index;
    this.setData({ currentPage: index });
  },
  onPlayOrPauseTap() {
    if (this.data.isPlaying) {
      audioContext.pause();
      this.setData({ isPlaying: false });
    } else {
      audioContext.play();
      this.setData({ isPlaying: true });
    }
  },
  onPrevBtnTap() {
    this.onChangeNewSong(false);
  },
  onNextBtnTap() {
    this.onChangeNewSong();
  },
  // 上 下首歌的代码抽离逻辑
  onChangeNewSong(isNext = true) {
    let index = this.data.playSongsIndex;
    const length = this.data.playSongsList.length;

    switch (this.data.playModeIndex) {
      case 0: // 顺序播放
        index = isNext ? index + 1 : index - 1;
        if (index === length) index = 0;
        if (index === -1) index = length - 1;
        break;
      case 1: // 单曲播放
        break;
      case 2: // 随机播放
        index = Math.floor(Math.random() * length);
        break;
    }

    const nextSong = this.data.playSongsList[index];
    // 再获取下一首歌数据前 将上一首歌的数据清空
    this.setData({
      curSong: {},
      currentTime: 0,
      durationTime: 0,
      sliderValue: 0,
    });
    // 播放新歌
    this.setupPlaySong(nextSong.id);
    // 保存最新的索引 应该在共享里面
    playStore.setState("playSongsIndex", index);
  },
  onModeBtnTap() {
    let modeIndex = this.data.playModeIndex;
    modeIndex = modeIndex + 1;
    if (modeIndex === 3) modeIndex = 0;
    this.setData({
      playModeIndex: modeIndex,
      playModeName: modelNames[modeIndex],
    });
  },
  getPlaySongsInfo(value) {
    // 哪一个变化就传哪一个值
    if (value.playSongsIndex !== undefined) {
      this.setData({ playSongsIndex: value.playSongsIndex });
    }
    if (value.playSongsList) {
      this.setData({ playSongsList: value.playSongsList });
    }
  },
  onUnload() {
    playStore.offStates(
      ["playSongsList", "playSongsIndex"],
      this.getPlaySongsInfo
    );
    audioContext.pause();
  },
});
