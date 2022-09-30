// pages/detail-song/detail-song.js
import recommendStore from "../../store/recommendStore";
import rankingStore from "../../store/rankingStore";
import { getPlaylistDetail } from "../../service/music-api";
import playStore from "../../store/playStore";
Page({
  data: {
    type: "ranking",
    key: "newRanking",
    id: "",
    songInfo: {},
  },
  onLoad(options) {
    // 进入的时候监听
    const type = options.type;
    this.setData({ type });

    // 获取store中榜单数据
    if (type === "ranking") {
      const key = options.key;
      this.data.key = key;
      rankingStore.onState(key, this.handleRanking);
    } else if (type === "recommend") {
      recommendStore.onState("recommendSongsInfo", this.handleRanking);
    } else if (type === "menu") {
      this.data.id = options.id;
      this.toGetMenuSongInfo();
    }
  },
  handleRecommednState(value) {
    this.setData({ songs: value });
  },
  async toGetMenuSongInfo() {
    const res = await getPlaylistDetail(this.data.id);
    this.setData({ songInfo: res.playlist });
  },
  handleRanking(value) {
    this.setData({ songInfo: value });

    wx.setNavigationBarTitle({
      title: value.name,
    });
  },
  onSongItemTap(e) {
    playStore.setState("playSongsList", this.data.songInfo.tracks);
    playStore.setState("playSongsIndex", e.currentTarget.dataset.index);
  },
  onUnload() {
    // 退出的时候不需要监听
    if (this.data.type === "ranking") {
      rankingStore.offState(this.data.key, this.handleRanking);
    } else if (this.data.type === "recommend") {
      recommendStore.offState("recommendSongsInfo", this.handleRanking);
    }
  },
});
