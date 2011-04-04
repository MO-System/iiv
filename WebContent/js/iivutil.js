//assumes jquery is included
//http://192.168.56.101/islandora/annotation/delete/1/admin
//http://192.168.56.101/islandora/annotation/insert/abc1234/text/x=1,y=1,d0=1,d1=1/1
//http://192.168.56.101/admin/settings/iiv_annotation_flag
/**
 * Util functions to use with iiv
 * 
 */
var searchStatus = "";
var alertTimerId = 0;
var annotationArray = new Array();
var popup = null;

//Parent function to be called to called by other events to set up everything for the annotations display
function annotationInit(pid){
	clearSelectBox();
	//TODO Reactive line below when functionaly has been extended to deal with an empty or nonexistant layer
	//clearAnnotationLayer();
	queryForAnnotation(pid);
	
}

// function to select annotations, calls module to select the drupal database
function queryForAnnotation(pid){
	//alert("IIVUtil.js - queryForAnnotation");  //test code
	
	var baseURL= drupal_domain + "/islandora/annotation/select";
	var newURL = baseURL +'/'+ pid + '/?callback=?' ;

	//call delete function
    $.getJSON(newURL, function (data){
                        queryForAnnotationCallback(data);
                        //alert(data);
                      });
}

function queryForAnnotationCallback(data){

	//ensure the selectBox is reset
	clearSelectBox();
	
	//counter, offset to allow for the two entries of public and my annotation in selectBox
	var counter = 3;
	
	for (var i=0;i<data.length;i++){
		var obj = data[i];
		
		//grab the date for selectBox and format it to DD/MM/YYYY
		var date = new Date(obj.timestamp * 1000);
		var day = date.getDate();
		var month = date.getMonth() + 1;
		var year = date.getFullYear();
		
		var dateDisplay = "" + day + "/" + month + "/" + year;
					
		//grab the first 20 characters in the annotation to help with selectionBox display
		var annDisplay = obj.annotation_text.substr(0,20);
		
		var display = dateDisplay + " - " + annDisplay;
		
		
		//build the values in the selectBox
		jQuery('#selectBox').append('<option value="' + counter + '">' + display + '  </option>');
		
		//add the value to the annotationArray so it can be called later
		//alert(obj.annotation_text + "   " + obj.annotation_text);
		//TODO JSON public key probably needs to be changed from "Public" as that word might be protected
		//TODO this new key would go in the next line where the 1 is hard coded
		var tempAnnotation = new annotationObject(obj.annotation_text, obj.annotation_location_size, 1, obj.uid, obj.aid);
		annotationArray[counter] = tempAnnotation;
		counter++;
	}		
	
}

function showAnnotation(index){	
	
	//check if they want to view all public annotations
	if (index == "Public" ){
		
		//clear all annotations		
		clearAnnotationLayer();
		
		//disable the Flag Annotation Button
		jQuery('#buttonFlagAnnotation').attr("disabled", true);
		//alert("Showing Public Annotations Check 1");	
		
		for (var i=3;i<annotationArray.length;i++){
			var obj = annotationArray[i];
			//Show all public annotations
			//alert("obj.pub " + obj.pub );
			if (obj.pub == "1"){
				//alert("Showing Public Annotations Check 3");
				drawPolygon(obj.text, obj.geom);
			}
		}
	}
	//display a persons private annotations
	else if (index == "Private"){
		
		//clear all annotations		
		clearAnnotationLayer();
		
		//disable the Flag Annotation Button
		jQuery('#buttonFlagAnnotation').attr("disabled", true);
		//alert("Showing Private Annotations Check 1");		
	    
		for (var i=3;i<annotationArray.length;i++){
			var obj = annotationArray[i];
			//alert("UID Logged In / UID of Annotation: " + drupal_uid + "/"+ obj.uid );			
			if (obj.uid == drupal_uid){
				//alert("Showing My Private Annotations Check 2");
				drawPolygon(obj.text, obj.geom);
			}
		}
	}
	else if (index == "Clear"){
		clearAnnotationLayer();
	}
	//display the selected annotation
	else {
		
		//clear all annotations		
		clearAnnotationLayer();
		
		//enable the Flag Annotation Button
		jQuery('#buttonFlagAnnotation').attr("disabled", false);
		var obj = annotationArray[index];
		//destroyAnnotPopup();  // ??? 
		drawPolygon(obj.text, obj.geom);
	}
	
}
		


//function to instantiate an annotations Object 
function annotationObject(text, geom, pub, uid, aid){
	this.text = text;
	this.geom = geom;
	this.pub = pub;
	this.uid = uid;
	this.aid = aid;
}


function clearSelectBox(){
	jQuery('#selectBox').children().remove();
    
	//initialize base values
	jQuery('#selectBox').append('<option value="Clear">--Clear--</option>');
	jQuery('#selectBox').append('<option value="Public"> All Annotations </option>');
   	jQuery('#selectBox').append('<option value="Private"> My Annotations </option>');
   	
   	annotationArray = new Array();
    
}
/**
 * @deprecated 
 * @param details
 */
function parseSearchResults(details){
	//TODO:remove once we connect the pieces together, this was only used for testing
	$("div.status").text("Server Message:" + details);
}
/**
 * @deprecated
 * @param details
 */
function updateStatusOnPage(details){
	//TODO:remove once we connect the pieces together, this was only used for testing
	$("div.status").text("Server Message:" + details);
}

// function to remove annotations from drupal database
function deleteAnnotation(aid){
	var baseURL="/islandora/annotation/delete";
	// call query function 
	var newURL = baseURL +'/'+ aid +'/json?callback=?';
	
	//call delete function
    $.getJSON(newURL, function (data){
                        deleteAnnotationCallback(data);
                        //alert(data);
                      });
}

function deleteAnnotationCallback(data){
}

// function to add annotations, call module to insert in the drupal database
function addAnnotation(pid,annotationText,annotationLocation,private){
	//http://192.168.56.101/islandora/annotation/insert/abc123/highthere/x=1,y=2,d=2,d1=2/1
	//var baseURL="http://192.168.56.101/islandora/annotation/insert";
	//messages success/error
	
	var escapedText = encodeURIComponent(annotationText);
	var newURL = drupal_domain + "/islandora/annotation/insert/";
	newURL += pid +'/' + escapedText  + '/' +  annotationLocation +'/' + private + "/?callback=?";
      
    //call query function
    $.getJSON(newURL, function (data){
                        addAnnotationCallback(data);
                        //alert(data);
                      });
}
function addAnnotationCallback(data){
    for(i=0; i< data.length; i++){
        var obj = data[i];
        alert(obj.message);
    }
}
//function to select annotations, calls module to select the drupal database
function flagAnnotation(index){
	//get the object with the corresponding index
	var obj = annotationArray[index];
	
	var baseURL= drupal_domain + "/islandora/annotation/flag";
	var newURL = baseURL +'/'+ obj.aid + '/?callback=?';
	
	//call query function
    $.getJSON(newURL, function (data){
                        flagAnnotationCallback(data);
                        //alert(data);
                      });
	
}

function flagAnnotationCallback(data){
	
	//this function doesn't seem to be necessary - Mark 
	//alert("IIVUtil: flagAnnotationCallback"); //test code
}

//function to select annotations, calls module to select the drupal database
function unflagAnnotation(aid){
	var baseURL= drupal_domain + "/islandora/annotation/unflag";
	var newURL = baseURL +'/'+ aid +'/?callback=?';
	
	//call query function
    $.getJSON(newURL, function (data){
                        unflagAnnotation(data);
                        //alert(data);
                      });

}

//function to grab coordinates for text to highlight
function getHighlightCoordinates(pid, query){
    var newURL = drupal_domain + "/islandora/annotation/highlight/" + pid + "/" + query + "/?callback=?";
      
    //call query function
       $.getJSON(newURL, function (data){
                        getHighlightCoordinatesCallback(data);
                        //alert(data);
                      }); 
}


function getHighlightCoordinatesCallback(retData){
   //first clear all boxes
   clearHighlightLayer();
   
   //draw results
   for(var i=0;i<retData.length;i++){
        var obj = retData[i];
        drawBox(obj);
    }
   // used so search button will be disabled if a search is in progress
   searchStatus = "done";
   clearTimer();
}
/**
 * setupPopControl
 * 
 */
//added by sfb
function setupPopControl(){
	   map.addControl(polyControl);
	   //polyControl.activate();
	   document.getElementById('iiv-image-panel').style.cursor = 'crosshair';
}
//Sabina
function setupPopControlforPolygon(){	   
	   map.addControl(mulpolyControl);
	   mulpolyControl.activate();	 
	   document.getElementById('iiv-image-panel').style.cursor = 'crosshair';
}
//added by sfb
/**
 * onPopupClose
 * Close the popup
 */
function onPopupClose(evt) {
    // 'this' is the popup.
    document.getElementById('iiv-image-panel').style.cursor = 'move';
    closePopupAndChangeControls();

}

/**
 * boxNotice
 * When the selects a polygon
 */
//added by sfb
function boxNotice(geom) {

    var feature = new OpenLayers.Feature.Vector(geom, null, {
        strokeColor: "#0033ff",
        strokeOpacity: 0.7,
        strokeWidth: 5
    });
    // if there is already a popup shown remove it
    if (popup != null ) {
	    map.removePopup(popup);
	    popup.destroy();
	    popup = null;
    }
    featureSelect(feature);
}//boxNotice

//Sabina
function toggleHighlightLayer(){
	var highlightLayer = getHighlightLayer();
	if(highlightLayer!==null){
		if(highlightLayer.getVisibility()===true){		
			highlightLayer.setVisibility(false);
		}
		else{
			highlightLayer.setVisibility(true);
		}
	}
}
function toggleAnnotationLayer(){
	var annoLayer = getAnnotationLayer();
	if(annoLayer!==null){
	       if(annoLayer.getVisibility()===true){	   
	           
	        for(var i=0;i<map.popups.length;i++){
	        	map.popups[i].hide();
	         }
		    annoLayer.setVisibility(false);
			
		}
		else{			
			annoLayer.setVisibility(true);
			 for(i=0;i<map.popups.length;i++){
	        	map.popups[i].show();
	         }
		}
	}
	annoLayer.feature.popup.toggle();
}
function drawPolygon(annotationText,geom)
{
   var pointList = [];
   var splitPixels=geom.split(","); 
   for(var i = 0; i < splitPixels.length; i++){
   	   var splitXY=splitPixels[i].split(" ");    	   
   	   var x=(parseInt(splitXY[0]));
   	   var y=(parseInt(splitXY[1]));
   	   var aPoint = new OpenLayers.Geometry.Point(x,y);
          pointList.push(aPoint);
   }
	// create a polygon feature from a list of points
	var linearRing = new OpenLayers.Geometry.LinearRing(pointList);     
	var polygonFeature = new OpenLayers.Feature.Vector(linearRing, null);	
        annotationLayer = getAnnotationLayer();	
	annotationLayer.addFeatures([polygonFeature]);      
	//alert(annotationLayer.getVisibility()); 	
	var popupPosition = polygonFeature.geometry.getBounds().getCenterLonLat();//lonlat
	//Set minimum height and width of Popup
	var height=60;
	var width=100;	
	var stringLength=annotationText.length; 
	//change height and width according to annotation text length
	if(stringLength>30)	{
		width=width+(stringLength/2);
		height=height+20;	
	}			
	popup = new OpenLayers.Popup.Anchored(polygonFeature.id, //id 	
					popupPosition,
					new OpenLayers.Size(width,height),//size w*h                                     
					"<font color='green'>"+annotationText+"</font>",//HTML content
					null,//anchor
					true,//function to be called on closeBox Click
					onAnnotationPopupClose);
	var opacity =0.8;		
	polygonFeature.popup=popup;
	popup.setOpacity(opacity);       
	map.addPopup(popup);      	
}
function destroyAnnotPopup()
{
	
	if (popup !== null ) {
	    map.removePopup(popup);
	    popup.destroy();
	    popup = null;
    }
	
}
function destroyAllTextPopups()
{	
	var len=map.popups.length;
	if((map.popups.length)>0){	
		for(var i=0;i<len;i++){
		map.popups[0].destroy();				
		}
	}        
}

function onAnnotationPopupClose(evt) {   
    // alert(evt);      
    document.getElementById('iiv-image-panel').style.cursor = 'move';
    map.removePopup(this); 
    var featureid=annotationLayer.getFeatureById(this.id);
    featureid.destroy();    
    popup=null;
} 
  
function getAnnotationLayer(){
    var annotationLayer = this.map.getLayersByName("annotationLayer");
    if(annotationLayer.length > 0){
        return annotationLayer[0];
    }
    else{
        var styleMap = new OpenLayers.StyleMap(OpenLayers.Util.applyDefaults(
        {fillColor: "yellow", fillOpacity: 0.3, strokeColor: "green"},
        OpenLayers.Feature.Vector.style["default"]));
        
        highlightLayer = new OpenLayers.Layer.Vector("annotationLayer", {styleMap : styleMap});
        this.map.addLayers([highlightLayer]);
        return highlightLayer;
    }
}

function clearAnnotationLayer(){
	
       destroyAllTextPopups();
       getAnnotationLayer().destroyFeatures();
}


/**
 *  featureSelect - show dialog for selection
*/
// added by sfb
function featureSelect(feature) {
    //need to have a minimum selection
    if (feature.geometry.getArea() < 10)
        return;

    
    document.getElementById('iiv-image-panel').style.cursor = 'move';
    /*
    */
     selectedFeature = feature;
    var bounds = selectedFeature.geometry.getBounds();
    var coordinates = selectedFeature.geometry;
    coordinates = coordinates.components[0].components;    
    var coordsString = "";
    for(i=0; i<coordinates.length; i++){
        var current = coordinates[i];
        coordsString += current.x + " ";
        coordsString += current.y + ",";
    }
    coordsString = coordsString.substr(0,coordsString.length -1);  
     //leaving in for now, we may need this sfb
    //var currZoom = map.getZoom();
   // var canvasSize = mapcanvas;
    //if (currZoom == ZOOMIN)
    //    canvasSize = canvasMax;
    //if (currZoom == ZOOMOUT)
     //   canvasSize = canvasMin;

    /*
    alert (sortOutSelectedBox(bounds.toArray(), canvasSize, parseInt(bounds.getWidth()),
        parseInt(bounds.getHeight())));
    */
    
    var viewerUI = this;
    var title = "www.islandnewspapers.ca";
   // var publicORpriv = $('#annotationPublic').attrib('checked')?1:0;
    		
    //TODO: test the input field to ensure text exists
    //var testField = "if ($('#annotationText').val().length > 0) { return true } else { alert('Please ensure annotation text');}";
    var onClickText = "saveAnnotation($('#annotationText').val(),'" + coordsString + "', $('#annotationPublic').attr('checked')?1:0)";
    popup = new OpenLayers.Popup.FramedCloud("Region", 
        feature.geometry.getBounds().getCenterLonLat(),
        null,
        "<div id='popupdiv'><strong>Selection from <i>" +
        title +"</i></strong><br/>\n" +
        "Please enter an annotation for the selected information, or<br/>\n" +
        "close this popup if you want to make another selection.<br/><br/>" +
        "<strong>Annotation Text:</strong><br/>" +       
        "<div id='saveData' align='right'>" +
        "<form name='popform' action='#'>"+ 
        "<textarea name='annotationText' id='annotationText' cols='42' rows='6' wrap></textarea><br/>" + 
        "<input type='checkbox' name='annotationPublic' id='annotationPublic' value='1' checked /> Public "+
        "<a href='#' onclick=\"" + onClickText + "\">Save</a>"+
        "</form></div>" + 
        "<br clear=\"left\"/>" +
       // sortOutSelectedBox(bounds.toArray(), canvasSize, parseInt(bounds.getWidth()),
       // parseInt(bounds.getHeight())) +
        "<br clear=\"left\"/>" +
        //"<i>Coming Soon: annotate this selection!</i>" +
        "</div>", 
        null, true, onPopupClose);
       feature.popup = popup;
    map.addPopup(popup);
}//featureSelect
/**
 * saveAnnotation
 * 
 */
 
function saveAnnotation(annotationText,coordinates, publicOn){
	var pid=viewer.currentPid();
	addAnnotation(pid,annotationText,coordinates,publicOn);
	closePopupAndChangeControls();
	
	//add new Annotaiton to the selectBox
	var display = 'Now - ' + annotationText.substr(0,20);
	jQuery('#selectBox').append('<option value="' + annotationArray.length + '">' + display  + '</option>');
			
	var tempAnnotation = new annotationObject(annotationText, coordinates, 1, drupal_uid, 0);
	annotationArray.push(tempAnnotation);	
}

function drawBox(obj){
    var styleMap = new OpenLayers.StyleMap(OpenLayers.Util.applyDefaults(
        {fillColor: "yellow", fillOpacity: 0.3, strokeColor: "green"},
        OpenLayers.Feature.Vector.style["default"]));

                
	// y coordinates in the words XY start at 0 from the top where as
	// open layers consideres 0 the bottom.  Take the complement of the
	// given y value relative to the map height to invert the value. Note that in the Bounds function
	// the top value of the words xy data is passed to the bottom parameter in the function
	// because of this inversion.
	
	var mapHeight = this.map.maxExtent.top;
	bounds = new OpenLayers.Bounds(obj.l, (mapHeight - obj.t), obj.r, (mapHeight - obj.b));
	                    
	hightlightBox = new OpenLayers.Feature.Vector(bounds.toGeometry(),{styleMap: styleMap});
	
	var highlightLayer = getHighlightLayer();                     
	highlightLayer.addFeatures(hightlightBox);                   
                            
}//drawBox

function getHighlightLayer(){
    var highlightLayer = this.map.getLayersByName("highlightLayer");
    if(highlightLayer.length > 0){
        return highlightLayer[0];
    }
    else{
        var styleMap = new OpenLayers.StyleMap(OpenLayers.Util.applyDefaults(
        {fillColor: "yellow", fillOpacity: 0.3, strokeColor: "green"},
        OpenLayers.Feature.Vector.style["default"]));
        
        highlightLayer = new OpenLayers.Layer.Vector("highlightLayer", {styleMap : styleMap});
        this.map.addLayers([highlightLayer]);
        return highlightLayer;
    }
}

function clearHighlightLayer(){
    getHighlightLayer().destroyFeatures();
}
/**
 * clearTimer()
 * Used for the search option, see searchToggle() 
 */
function clearTimer(){
	  // Clear the timer 
	clearTimeout(alertTimerId);
}
/**
 * checkStatusAndSearch() 
 * Check to make sure a search is not already in progress, if not search  
 */
function checkStatusAndSearch(pid,query){
    //save the most recent search so we can auto fire it on page turn
	 solr_search_term = query;
	 // Is there search in progress
	  if (searchStatus == "" || searchStatus == "done"){
		  // the normal flow will not need this timer but this here in case a error occurs 
		  // getting a response from the highlight search 
		  //set a timer so the search can be run after 2 minutes
		  //TODO:Update to the the default value
		  var timeOut= 5000; // 5 secs
		  //var timeOut= 120000; // 2 minutes
		  alertTimerId = setTimeout ( "clearTimer()", timeOut );
		  searchStatus = "in progress";
		  // call the search
		  getHighlightCoordinates(pid, query);
	  }else{
		 // Show dialog, search is already in progress
		  $(function() {
			 //TODO:If someone knows a better style to use fell free
		    $("<div id='dialog' title='Search Status' class='iiv-ui'><span class='text'>Search already in progress.</span></div>").dialog({
		      bgiframe: true,
		      modal: true,
		      buttons: {
		        Ok: function() {
		          $(this).dialog('close');
		        }
		      }
		    });
		  });
	  }
}
function changeBackToImage(){
	// deactivate controls
	for( var i=0; i<map.controls.length; i++ ) {
		map.controls[i].deactivate();
	} 
	//set back to navigation control
	map.getControl("OpenLayers.Control.Navigation_4").activate();
	//map.getControl("OpenLayers.Control.MouseDefaults_4").activate();
	//map.getControl("OpenLayers.Control.KeyboardDefaults_5").activate();
}
/**
 * closePopupAndChangeControls
 * Used to shut off the drawing controls for polygons
 * Closes any related popups
 * 
 */
function closePopupAndChangeControls(){
    //set focus back to map so selection doesn't occur again
    changeBackToImage();
    // check for polygons with 4 sides
    if (polyControl != null ) {
    	if (polyControl.box != null){
    		polyControl.box.clear(); 
        	polyControl.deactivate();
    	}
    }
    // check for polygons > 4 sides
    if (mulpolyControl != null ) {
      	if ( mulpolyControl.poly != null ){
    		mulpolyControl.poly.control.poly.deactivate();
    	}
    }

	if (popup != null ) {
	    map.removePopup(popup);
	    popup.destroy();
	    popup = null;
    }
}
  