let sampleTaxonId = $.args.sampleTaxonId;
let taxonId = $.args.taxonId;
let key = $.args.key;
let { disableControl, enableControl, setError, clearError } = require("ui/ViewUtils");

let readOnlyMode = $.args.readonly === true;
Ti.API.info(`EditTaxon readOnlyMode = ${readOnlyMode}`);
$.photoSelect.setReadOnlyMode(readOnlyMode);
if ( readOnlyMode ) {
    disableControl($.deleteButton);
    disableControl($.abundanceValue);
}



let sample = Alloy.Models.sample;
let taxon = null;

/* if we a referencing an existing taxon load the specific one by sampletaxonid */
if (sampleTaxonId) {
    Ti.API.info(`calling with sampleTaxonId = ${sampleTaxonId}`)
    taxon = Alloy.Collections["taxa"].findSpecificTaxon(sampleTaxonId);
    taxonId = taxon.get("taxonId");
} else if ( taxonId != null )  {
    Ti.API.info("not calling with sampleTaxonId")
    taxon = Alloy.Collections["taxa"].findTaxon(taxonId);
}

Ti.API.info(`taxonId = ${taxonId}`);
if ( taxonId ) {
    $.taxonName.text = key.findTaxonById(taxonId).commonName;
} else {
    $.taxonName.text = "Unknown Bug";
}

if (!taxon ) {
    var taxons = Alloy.createCollection("taxa"); 
    taxons.loadTemporary(taxonId); 
    taxon = taxons.first();
    if ( !taxon ) {
        // creates a taxa but leaves it unlinked from sample until save event recieved
        Ti.API.info("creating new taxon as temporary taxon")
        taxon = Alloy.createModel( 'taxa', { taxonId: taxonId, abundance: "1-2" } );
        taxon.save();
    } else {
        Ti.API.info(`existing temporary taxon ${JSON.stringify(taxon)}`);
    }
} else {
    Ti.API.info(`existing persisted taxon ${JSON.stringify(taxon)}`);
}



var realPhoto = false;
function isDefaultPhoto() {
    return !realPhoto; 
}
setAbundance( taxon.get("abundance") );
setImage( taxon.getPhoto());
updateSaveButton();

function persistTaxon() {
    taxon.save();
    $.trigger("persist", taxon );
}



function persistPhoto() {
    taxon.setPhoto( $.photoSelect.getFullPhotoUrl() );
    // necessary because setPhoto as a side effect changes the photo url.
    // CODE SMELL: this breaks encapsulation, long term fix would be to rewrite to
    // use events on taxon model to propagate changes.
    $.photoSelect.photoUrls = [taxon.getPhoto()]; 
    persistTaxon();
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
    persistTaxon();
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
    taxon.set("sampleId", sample.get("sampleId"));
    Alloy.Collections.taxa.add( taxon );
    taxon.save();
    $.trigger("save", taxon );
    closeEvent();
}

function doDelete() {
    Alloy.Collections.taxa.remove( taxon );
    taxon.destroy();
    closeEvent();
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

function fixupLayout() {
    let eight = $.closeButton.size.height;
  /*  Ti.API.info(`EditTaxon.size.height = ${$.window.size.height}`); 
    Ti.API.info(`header.size.height = ${$.header.size.height}`);
    Ti.API.info(`howMany.size.height = ${$.howMany.size.height}`);
    Ti.API.info(`buttons.size.height = ${$.buttons.size.height}`); */
    $.photoSelectWrapper.height = $.window.size.height 
            - $.header.size.height 
            - $.howMany.size.height 
            - $.buttons.size.height- eight/2;
}

/* need to trap photoSelectWrapper in order to make sure the other children elements
   have stablised their size before we use them to size the photoSelect control */
$.photoSelectWrapper.addEventListener("postlayout", fixupLayout );

function cleanUp() {
    $.window.removeEventListener("postlayout", fixupLayout );
    $.photoSelect.cleanUp();
    $.destroy();
    $.off();
}

exports.cleanUp = cleanUp;
exports.setImage = setImage;
exports.setAbundance = setAbundance;
exports.isDefaultPhoto = isDefaultPhoto;