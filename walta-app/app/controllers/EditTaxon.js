var taxon = $.args.taxon;
var key = $.args.key;
var { disableControl, enableControl, setError, clearError } = require("ui/ViewUtils");

$.taxonName.text = key.findTaxonById( taxon.get("taxonId") ).commonName;

function cleanUp() {
    $.photoSelect.cleanUp();
    $.destroy();
    $.off();
}
var realPhoto = false;
function isDefaultPhoto() {
    return !realPhoto; 
}
setAbundance( taxon.get("abundance") );
setImage( taxon.getPhoto() );
updateSaveButton();

function setImage( photo ) {
    if ( photo ) {
        realPhoto = true;
        $.photoSelect.setImage( photo );  
        if ( $.photoSelect.getFullPhotoUrl() ) {
            taxon.setPhoto( $.photoSelect.getFullPhotoUrl() );
            taxon.save();
        }
    } else {
        realPhoto = false;
        $.photoSelect.setImage( taxon.getSilhouette() );
    }
}

function setAbundance( binValue  ) {
    taxon.set("abundance", binValue);
    $.abundanceValue.value = taxon.getAbundance();
    taxon.save();
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
    taxon.set("sampleId", sample.get("sampleId"));
    taxon.save();
    $.trigger("save", taxon );
}

function doDelete() {
    $.trigger("delete", taxon );
    Alloy.Collections.taxa.remove( taxon );
    taxon.destroy();
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
$.photoSelect.on("photoTaken", () => { realPhoto = true; updateSaveButton(); } );

exports.cleanUp = cleanUp;
exports.setImage = setImage;
exports.setAbundance = setAbundance;
exports.isDefaultPhoto = isDefaultPhoto;