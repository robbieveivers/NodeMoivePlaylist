const express = require('express');
const axios = require('axios');
const logger = require('morgan');
const router = express.Router();

//main function/passing in keywords to be searched and title of movie we are searching
router.get('/:query/:title', (req, res) => {
	//constructing URL to retrieve photos from flickr API
	const options = createFlickrOptions(req.params.query);
	const url = `https://${options.hostname}${options.path}`;

	axios.get(url)
		.then( (response) => {
			res.writeHead(response.status,{'content-type': 'text/html'});
			return response.data;
		})
		.then( (rsp) => {
			const s = createPage(req.params.title, ("%j", rsp));
			res.write(s);
			res.end();
		})
		.catch((error) => {
			console.error(error);
		})
});

//global const for flickr options
const flickr = {
	method: 'flickr.photos.search',
	api_key: "1720a2692462e06338f9d9cf37a6b2ba",
	format: "json",
	media: "photos",
	nojsoncallback: 1
};

//function to construct and return flickr photo retrieval URL
function createFlickrOptions(query){
	const options = {
		hostname: 'api.flickr.com',
		port: 443,
		path: '/services/rest/?',
		method: 'GET'
	}

	//deciding how many photos to return based on amount of keywords
	let queries = query.split(",").length;
	let number = 0;

	switch(true){
		case (queries <= 3):
			number = 100;
			break;
		case (queries > 3 && queries <=5):
			number = 200;
			break;
		case (queries > 5 && queries <= 7):
			number = 300;
			break;
		case (queries <7 && queries <=9):
			number = 400;
			break;
		default:
			number = 500;
	}

	//constructing and returning URL
	const str = 'method=' + flickr.method +
	'&api_key=' +flickr.api_key +
	'&tags=' + query +
	'&format=' + flickr.format +
	'&media=' + flickr.media +
	'&per_page=' + number +
	'&safe_search=2' +
	'&nojsoncallback=' + flickr.nojsoncallback;


	options.path += str;
	return options;
}

//function to parse and return JSON response as flickr links/images
function parsePhotoRsp(rsp){
	//reused from last week
	let s = "";

	for (let i=0; i< rsp.photos.photo.length;i++){
		photo=rsp.photos.photo[i];
		t_url = "http://farm" + photo.farm + ".static.flickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + "_" + "t.jpg";
		p_url = "http://www.flickr.com/photos/" + photo.owner + "/" + photo.id;
		s +=  '<div class="photoGallery"><a href="' + p_url + '">' + '<img alt="'+ photo.title + '"src="' + t_url + '"/>' + '</a></div>';
	}
	return s;
}

//main function to build the page after API response is recieved
function createPage(title, rsp){
	const number = rsp.photos.photo.length; //check how many images we returned
	const imageString = parsePhotoRsp(rsp); //parsing JSON response into HTML

	const str = '<!DOCTYPE html>' +
		'<html><head>' +
		'<link rel="stylesheet" type="text/css" href="/stylesheets/style.css"/>' +
		'<meta charset="utf-8"><title>'+title+'</title></head>' +
		'<header><div class="itemBackground"><form action="/"><button class="homeBTN">Home</button></form>' +
		'<h1>Images related to ' + title +'</h1>'+ 
		'<div id="imagesRet">' +number+ ' images returned</div></br></div></header>' +
		'<br><body><div class="itemBackground">' +
		imageString +
		'</div></body></html>';
	return str;

}

module.exports = router;