var taxon = $.args.taxon;
var key = $.args.key;
var { disableControl, enableControl, setError, clearError } = require("ui/ViewUtils");
$.taxonName.text = key.findTaxonById( taxon.get("taxonId") ).commonName;

function cleanUp() {
    
    $.photoSelect.cleanUp();
    $.destroy();
    $.off();
}

setAbundance( taxon.get("abundance") );
if ( taxon.getPhoto() )
    setImage( taxon.getPhoto() );

var realPhoto = false;
updateSaveButton();

function setImage( photo ) {
    if ( photo ) {
        realPhoto = true;
        $.photoSelect.setImage( photo );  
    } else {
        realPhoto = false;
        $.photoSelect.setImage( taxon.getSilhouette() );
    }
}

function setAbundance( binValue  ) {
    taxon.set("abundance", binValue);
    $.abundanceValue.value = taxon.getAbundance();
}

function updateAbundance() {
    var val = $.abundanceValue.value
    var binValue;
    if ( val >= 1 && val <= 3 ) {
        binValue = "1-2";
    } else if ( val > 3 && val <= 6 ) {
        binValue = "3-5";
    } else if ( val > 6 && val <= 11 ) {
        binValue = "6-10";
    } else if ( val > 11 && val <= 20 ) {
        binValue = "11-20";
    } else {
        binValue = "> 20";
    }
    $.abundanceLabel.text = binValue; 
}

function saveEvent() {
    taxon.set("abundance", $.abundanceLabel.text );
    taxon.setPhoto( $.photoSelect.getImageUrl() );
    $.trigger("save", taxon );
}

function doDelete() {
    $.trigger("delete", taxon );
}

function deleteEvent() {
    var dialog = Ti.UI.createAlertDialog({
        message: 'Are you sure you want to delete this taxon?',
        cancel: 1,
        buttonNames: [ 'Delete', 'Cancel' ],
        title: 'Confirm Delete'
      });
      dialog.addEventListener('click', function(e) {
        if (e.index === 0) {
            doDelete();
        }
      });
      dialog.show();
}

function closeEvent() {
    $.trigger("close");
}

function updateSaveButton() {
    if ( realPhoto ) {
        $.photoSelect.clearError();
        enableControl($.saveButton);
    } else {
        $.photoSelect.setError();
        disableControl($.saveButton);
    }
}

$.photoSelect.on("loaded", updateSaveButton);
$.photoSelect.on("photoTaken", updateSaveButton );

exports.cleanUp = cleanUp;
exports.setImage = setImage;