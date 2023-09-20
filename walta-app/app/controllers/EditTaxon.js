const Logger = require("util/Logger");
var moment = require("lib/moment");
let sampleTaxonId = $.args.sampleTaxonId; 
let taxonId = $.args.taxonId;
let key = $.args.key;
let { disableControl, enableControl } = require("ui/ViewUtils");

let readOnlyMode = $.args.readonly === true;
Logger.log(`EditTaxon readOnlyMode = ${readOnlyMode}`);
$.photoSelect.setReadOnlyMode(readOnlyMode);
if ( readOnlyMode ) {
    disableControl($.deleteButton);
    disableControl($.abundanceValue);
}

let sample = Alloy.Models.instance("sample");
let sampleId = sample.get("sampleId");
let taxon = null;

/* if we a referencing an existing taxon load the specific one by sampletaxonid */
if (sampleTaxonId) {
    Logger.log(`calling with sampleTaxonId = ${sampleTaxonId}`)
    taxon = Alloy.Collections["taxa"].findTaxonBySampleTaxonId(sampleTaxonId);
    taxonId = taxon.get("taxonId");
} else if ( taxonId != null )  {
    Logger.log("not calling with sampleTaxonId")
    taxon = Alloy.Collections["taxa"].findTaxon(taxonId);
}

Logger.log(`taxonId = ${taxonId}`);
if ( taxonId ) {
    $.taxonName.text = key.findTaxonById(taxonId).commonName;
} else {
    $.taxonName.text = "Unknown Bug";
}

if (!taxon ) {
    var taxons = Alloy.createCollection("taxa"); 
    taxons.loadTemporary(sampleId, taxonId); 
    taxon = taxons.first();
    if ( !taxon ) {
        Logger.log(`creating new taxon as temporary taxon for sampleId = ${sampleId}`)
        taxon = Alloy.createModel( 'taxa', { sampleId: sampleId, taxonId: taxonId, abundance: "1-2" } );
        taxon.save();
    } else {
        Logger.log(`existing temporary taxon ${JSON.stringify(taxon)}`);
    }
} else {
    Logger.log(`existing persisted taxon ${JSON.stringify(taxon)}`);
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
    let photoUrl = taxon.setPhoto( $.photoSelect.getFullPhotoUrl() );
    taxon.set("serverCreaturePhotoId", undefined);
    $.photoSelect.photoUrls = [photoUrl]; 
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
    Alloy.Collections.taxa.add( taxon );
    taxon.save({ "updatedAt": moment().valueOf() });
    $.trigger("save", taxon );
    closeEvent();
}

function doDelete() {
    Alloy.Collections.taxa.remove( taxon );
    taxon.flagForDeletion();
    closeEvent();
    $.trigger("delete", taxon );
}

function deleteEvent() {
    let dialog = Ti.UI.createAlertDialog({
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

$.closeButton.on("close", closeEvent );

function closeEvent() {
    $.trigger("close") 
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
     $.photoSelectWrapper.height = $.window.size.height 
            - $.header.size.height 
            - $.howMany.size.height 
            - $.buttons.size.height 
            - 80; /*  We need this extra padding or else after the photoSelectWrapper 
                      size is set the buttons get pushed off the bottom which forces 
                      them to be squashed vertically which causes the wrapper to be 
                      set to a larger size thus causes positive a feedback loop! */
}

/* need to trap photoSelectWrapper in order to make sure the other children elements
   have stablised their size before we use them to size the photoSelect control */
$.photoSelectWrapper.addEventListener("postlayout", fixupLayout );

function cleanUp() {
    $.photoSelectWrapper.removeEventListener("postlayout", fixupLayout );
    $.photoSelect.cleanUp();
    $.destroy();
    $.off();
}

exports.cleanUp = cleanUp;
exports.setImage = setImage;
exports.setAbundance = setAbundance;
exports.isDefaultPhoto = isDefaultPhoto;