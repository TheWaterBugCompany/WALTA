
var Topics = require('ui/Topics');
var debug = m => Ti.API.info(m);
let currentController = null;
let saveOrDiscard = null;
exports.View = {
    getSaveOrDiscard: function() { return saveOrDiscard; },
    getCurrentController: function() { return currentController; },
    openView: function(ctl,args) {
        return new Promise( (resolve) => {
          debug(`opening controller="${ctl}" with args.readonly= ${args.readonly}`);
          currentController = Alloy.createController(ctl,args);
          currentController.on("window-opened", resolve);
          currentController.open();
        });
    },
    askDiscardEdits: function () {
        return new Promise(function (resolve, reject) {
          saveOrDiscard = Ti.UI.createAlertDialog({
            persistent: true,
            cancel: 1,
            message: "The current sample has unsaved edits, are you sure you want to discard these changes?",
            title: "Unsaved Changes",
            buttonNames: ['Discard', 'Cancel']
          });
          saveOrDiscard.show();
          Topics.fireTopicEvent(Topics.DISCARD_OR_SAVE);
          saveOrDiscard.addEventListener('click', function (e) {
            saveOrDiscard.hide();
            if (e.index == 0) {
              resolve();
            } else {
              reject();
            }
          });
        });
      }
}