var taxon = $.args.taxon;
var key = $.args.key;
var { disableControl, enableControl, setError, clearError } = require("ui/ViewUtils");

var readOnlyMode = $.args.readonly === true;
Ti.API.info(`EditTaxon readOnlyMode = ${readOnlyMode}`);
$.photoSelect.setReadOnlyMode(readOnlyMode);
if ( readOnlyMode ) {
    disableControl($.deleteButton);
    disableControl($.abundanceValue);
   
}

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
setImage( taxon.getPhoto());
updateSaveButton();


function persistPhoto() {
    taxon.setPhoto( $.photoSelect.getFullPhotoUrl() );
    // necessary because setPhoto as a side effect changes the photo url.
    // CODE SMELL: this breaks encapsulation, long term fix would be to rewrite to
    // use events on taxon model to propagate changes.
    $.photoSelect.photoUrls = [taxon.getPhoto()]; 
    $.trigger("persist", taxon );
}

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
    $.trigger("persist", taxon );
}

function updateAbundance() {
    var val = $.abundanceValue.value
    var binValue = taxon.convertCountToAbundance(val);
    if ( $.abundanceLabel.text !== binValue ) {
        $.abundanceLabel.text = binValue; 
        setAbundance(binValue);
    }
}

function saveEvent() {
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
    if ( readOnlyMode) {
        disableControl($.saveButton);
        return;
    }
    if ( realPhoto ) {
        $.photoSelect.clearError();
        enableControl($.saveButton);
    } else {
        $.photoSelect.setError(); 
        disableControl($.saveButton);
    }
}

$.photoSelect.on("loaded", updateSaveButton);
$.photoSelect.on("photoTaken", () => { 
    realPhoto = true;
    persistPhoto(); 
    updateSaveButton(); 
} );

exports.cleanUp = cleanUp;
exports.setImage = setImage;
exports.setAbundance = setAbundance;
exports.isDefaultPhoto = isDefaultPhoto;