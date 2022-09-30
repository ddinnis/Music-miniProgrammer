import { HYEventStore } from "hy-event-store";

const playStore = new HYEventStore({
  state: {
    playSongsList: [],
    playSongsIndex: 0,
  },
  actionss: {},
});

export default playStore;
