const express = require('express');
const router = express.Router();

//rendering basic index page HTML with form for user input redirection
router.get('/', (req, res) => {
	const str =  '<!DOCTYLE html>' +
    '<html><head><link rel="stylesheet" type="text/css" href="stylesheets/style.css"/>' +
    '<title>Home</title></head>'+
    '<header><div class="itemBackground"><h1>Movie based playlist creator/image retriever</h1>'+
    '<div id="pageSubtitle"></div><br><br>' +
    '</div></header><br><body><div class="itemBackground"><form class="searchForm" action="/movieSearch" method="post">' +
    '<label for="movieSearch">Search for Movie: </label><br>' +
    '<input id="movieSearch" type="text" name="searchField">' +
    '<br><br><input id="submitButton" type="submit" value="Search">' +
    '</div></body></html>';

    //write headers and data, then end
    res.writeHead(200,{'content-type': 'text/html'});
    res.write(str);
    res.end();
});

module.exports = router;