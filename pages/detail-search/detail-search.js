// pages/detail-search/detail-search.js
import {
  getSearchHotList,
  getSearchSuggest,
  getSearchRes,
} from "../../service/search";
Page({
  data: {
    hotList: [],
    searchValue: "",
    searchSuggestList: [],
    searchResList: [],
  },

  onLoad() {
    this.toGetHotList();
  },
  toGetHotList() {
    getSearchHotList().then((res) => {
      const hotList = res.result.hots;
      this.setData({ hotList });
    });
  },
  onChange(event) {
    this.setData({ searchValue: event.detail });
    getSearchSuggest(event.detail).then((res) => {
      console.log(res);
      if (res) {
        this.setData({ searchSuggestList: res.result.songs });
      }
    });
  },
  onSearch(event) {
    this.setData({ searchValue: event.detail });
    getSearchRes(event.detail).then((res) => {
      if (res) {
        this.setData({ searchResList: res });
      }
    });
  },
  onHotItemTap(event) {
    const searchValue = event.currentTarget.dataset.item.first;
    this.setData({ searchValue });
  },
});
