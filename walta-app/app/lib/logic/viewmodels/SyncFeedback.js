class SyncFeedbackViewModel {
  constructor({ topics }) {
    this._topics = topics;
    this.state = {
      status: "idle",
      percent: 0,
      statusText: "",
      logVisible: false,
      logLines: [],
    };
  }
}

module.exports = SyncFeedbackViewModel;
