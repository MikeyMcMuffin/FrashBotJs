var twit = require('twit');
var config = require('./config.js');
const schedule = require('node-schedule');
var drive = require("./drive.js");
const fs = require('fs');

var T = new twit(config);

var rule = new schedule.RecurrenceRule();
rule.hour = 16;
rule.minute = 44;

var j = schedule.scheduleJob(rule, function(){
	postImage();
});

T.get('followers/ids', { screen_name: 'mikey_mcmuffin' },  function (err, data, response) {
  console.log(data)
})

function postImage() {

	drive.getImage();

	var filepath;

	fs.readdirSync('tempImages/').forEach(filename =>{
		console.log('In here');
		 filepath = filename;
	})

	filepath = 'tempImages/' + filepath;

	var imageContent = fs.readFileSync(filepath, { encoding: 'base64' });

	T.post('media/upload', { media_data: imageContent }, function (err,data,response){
		if (err) {
        	console.warn("An error occurred while posting", err);
        	return;
    	}

		var mediaIdStr = data.media_id_string;
		console.log('Media String' + mediaIdStr);
		var altText = "A Beautiful Frash Frash.";
		var meta_params = {media_id: mediaIdStr, alt_text: { text: altText }};

		T.post('media/metadata/create', meta_params, function (err,data,response){
			if(!err){
				var params = { status: ' ', media_ids: [mediaIdStr] };

				T.post('statuses/update', params, function (err, data, response){
					if (err) {
        				console.warn("An error occurred while posting", err);
        				return;
    				}
					console.log('Posting');
				})
			}else{
				console.log('error: ' + err);
			}
		})
	})
}


