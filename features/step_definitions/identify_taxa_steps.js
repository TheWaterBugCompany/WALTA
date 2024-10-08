const { Given, When, Then } = require('cucumber');
const { startSurvey, addTaxonViaSpeedBug }  = require('../support/sample-driver');

Given('I have found a species to identify', function(){
  /* @current_page = page(MenuScreen).await */
});
  
When('I select the ALT key function', function() {
  /* @current_page.select_alt_key */
});

Then('the initial binary ALT key question is displayed', function(){
/*  @current_page = page(QuestionScreen).await
 @current_page.verify_questions('Animal with a shell', 'Animal without a shell') */
});

Given('a binary ALT question is displayed', function(){
  /* @current_page = page(MenuScreen).await
  @current_page.select_alt_key
  @current_page = page(QuestionScreen).await
  @current_page.verify_questions('Animal with a shell', 'Animal without a shell') */
});

When('I select either the first or second answer', function(){
  /* @current_page.select_question('Animal with a shell')
  @current_page = page(QuestionScreen).await */
});

Then('the next node from the ALT key is displayed', function(){
  /* expect( @current_page.is_a?(QuestionScreen) ).to be true
  @current_page.verify_questions('Animals look like snails or limpets.', 'Animals look like mussels.') */
});

Given('A leaf node of the ALT is displayed', function(){
  /* @current_page = page(MenuScreen).await
  @current_page.select_alt_key
  @current_page = page(QuestionScreen).await
  @current_page.select_question('Animal with a shell')
  @current_page.select_question('Animals look like snails or limpets.')
  @current_page.select_question('Animals look like limpets.')
  @current_page = page(TaxonScreen).await */
});

Given('I identify and store a Taxon', {timeout: 60000}, async function(){
  await startSurvey( this );
  await addTaxonViaSpeedBug( this, "hyriidae" )
});

Then('the EditTaxon screen is opened', async function(){
  await this.editTaxon.waitFor();
});

When('I set the abundance to {string}', {timeout: 60000}, async function(abundance){
  await this.editTaxon.setAbundance(abundance);
});

When('I save the taxon', {timeout: -1}, async function(){ 
  await this.editTaxon.openCamera();
  // photos aren't optional but we want to decouple the feature files
  // so "save" is interpreted as take photo and save...
  await this.camera.takePhoto(); 
  await this.editTaxon.waitFor();
  await this.editTaxon.save();
});

Then('the taxon displays {string} for the abundance', {timeout: 60000}, async function(abundance){
  await this.sample.waitFor(); // check we are really on the sample screen
  await this.sample.waitForText(abundance); // since we only have one taxon this should check for existence
});

Given('a node from the ALT key is displayed', async function(){
  await this.menu.selectIdentify();
  await this.methodSelect.viaKey();
  await this.keySearch.choose("Animal with a shell");
  await this.keySearch.waitForText("Animals look like snails or limpets.");
});


Given('I don\'t think this is the correct place in the key', function(){
  // do nothing
});

When('I select the back button', async function(){
  await this.keySearch.goBack();
});

Then('the parent node of this ALT node is displayed', async function(){
  await this.keySearch.waitForText("Animal with a shell");
});

Given('inside the ALT key identification process', function(){
  return "pending";
});

Given('I\'m done with the key', function(){
  return "pending";
});


When('I press the Home button', function(){
  return "pending";
});

Then('the ALT key process is exited', function(){
  return "pending";
});

Given('it has images attached', function(){
  return "pending";
});

When('I select the images', function(){
  return "pending";
});

Then('a photo gallery is displayed', function(){
  return "pending";
});



Given('the photo gallery is displayed', function(){
  return "pending";
});

Given('there are multiple images', function(){
  return "pending";
});

When('I swipe left or right', function(){
  return "pending";
});

Then('the next image is displayed', function(){
  return "pending";
});

Given('it has a video attached', function(){
  return "pending";
});

When('I select the video', function(){
  return "pending";
});

Then('the video player is opened', function(){
  return "pending";
});

Given('the video player is displayed', function(){
  return "pending";
});

When('I select the play button', function(){
  return "pending";
});

Then('the video starts playing', function(){
  return "pending";
});

Given('the video is playing', function(){

  return "pending";
});

When('I select the pause button', function(){
  return "pending";
});

Then('the video pauses', function(){
  return "pending";
});

Given('the video player or photo gallery is displayed', function(){
  return "pending";
});

Given('the video is paused', function(){
  return "pending";
});

Then('the video player or photo gallery is closed', function(){
  return "pending";
});

When('I select the close button', function(){
  return "pending";
});
