var express = require('express');
var fs = require('fs');
var mongoose = require('mongoose');
var Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;
//var email = require('mailer');
//var smtpc = require('smtpc');
var email = require('emailjs');
//var mail = require('module/calendar.js');

mongoose.connect('mongodb://localhost/blog');

var blogPost = new Schema({
	//blogid:{type:Number,required:true,unique:true,index:true},
	title: String,
	body: String,
	date: Date
});


var app = module.exports = express.createServer();

app.configure(function(){
	app.set('views',__dirname + '/views');
	app.set('view engine','jade');	
	app.register('.html',require('jade'));
	app.use(express.methodOverride());
	app.use(express.bodyParser());
	app.use('/public',express.static(__dirname + '/public'));
	//app.use(express.router);

});

app.set('view options',{layout:false});


app.get('/',function(req,res){
	res.render('index');
});


var blogPost = mongoose.model('blogPost',blogPost);

// add blog
app.get('/new',function(req,res){
	res.render('new',{title:'add a new blog'});
});

// save blog
app.post('/add',function(req,res){
	var post = new blogPost();
	post.title = req.body.title;
	post.body = req.body.content;
	post.date = new Date();

	post.save(function(err){
		if(err){
			console.log('save faile!');
			console.log(err);
		}else {
			console.log('save success!');
			post = null;
			res.redirect('/list');
		}
	});
});

// blog list
app.get('/list',function(req,res){

	blogPost.find({},function(err,docs){
		if(err){
			console.log(err);
		}else{
			res.render('list',{docs:docs});
		}
	});
});

// delete blog
app.get('/del/:id',function(req,res){
	blogPost.remove({_id:req.params.id},function(err){
		if(err){
			console.log(err);
		}else{
			res.redirect('/list');
		}
	});
});

// alter blog
app.get('/alter/:id',function(req,res){
	blogPost.findById(req.params.id,function(err,doc){
		if(err){
			console.log('Can not find the blog!');
		}else{
			res.render('alter',{doc:doc});
		}
	});
});
app.post('/update/:id',function(req,res){

	blogPost.update({_id:req.params.id},{$set:{title:req.body.title,body:req.body.content}},function(err){
		if(err){
			console.log('update err:');
			console.log(err);
		}else{
			res.redirect('/list');
		}
	});
});

app.get('/test',function(req,res){
	res.render('test');
});

app.get('/mail',function(req,res){
	res.render('mail');
});


var server = email.server.connect({
	user:"xj032085",
	password:"59685713868260",
	host:"smtp.gmail.com",
	//port:587,
	ssl:true
});
app.post('/send',function(req,res){
	var headers = {
		text:"i hope this works",
		from:"qiyou<xj032085@gmail.com>",
		to:"haha<qiyou.xj@taobao.com>",
		//to:"haha<qiyou.xj@taobao.com>",
		subject:"testing emailjs"
	};
	var data = email.message.create(headers);
	var message = "";
	message += "BEGIN:VCALENDAR\n";
	message += "METHOD:REQUEST";
	message += "PRODID:Microsoft Exchange Server 2010";
	message += "VERSION:2.0";
	message += "BEGIN:VTIMEZONE";
	message += "TZID:China Standard Time";
	message += "BEGIN:STANDARD";
	message += "DTSTART:16010101T000000";
	message += "TZOFFSETFROM:+0800";
	message += "TZOFFSETTO:+0800";
	message += "END:STANDARD";
	message += "BEGIN:DAYLIGHT";
	message += "DTSTART:16010101T000000";
	message += "TZOFFSETFROM:+0800";
	message += "TZOFFSETTO:+0800";
	message += "END:DAYLIGHT";
	message += "END:VTIMEZONE";
	message += "BEGIN:VEVENT\n";
	message += "ORGANIZER:MAILTO: qiyou.xj@taobao.com\n";
	message += "DTStart:" + Date.parse(2011,12,20,14,30,00) + "\n";
	message += "DTEnd:" + Date.parse(2011,12,20,16,30,00) + "\n";
	message += "Location;ENCODING=QUOTED-PRINTABLE: My home\n";
	message += "UID:"+Date.parse(2011,12,20,14,30,00)+Date.parse(2011,12,20,16,30,00) + "\n";
	message += "ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=淘宝-UED-前端业务支撑-交易&新业务:MAILTO:qiyou.xj@taobao.com";
	message += "ATTACH:CID:0F641F027BEAE1D58C4ADCA8E31E1333B94CF0A8@ali.com";
	message += "CLASS:PUBLIC";
	message += "PRIORITY:5";
	message += "DTSTAMP:20111126T152649Z";
	message += "TRANSP:OPAQUE";
	message += "STATUS:CONFIRMED";
	message += "SEQUENCE:0";
	message += "X-MICROSOFT-CDO-APPT-SEQUENCE:0";
	message += "X-MICROSOFT-CDO-OWNERAPPTID:1205516251";
	message += "X-MICROSOFT-CDO-BUSYSTATUS:TENTATIVE";
	message += "X-MICROSOFT-CDO-INTENDEDSTATUS:BUSY";
	message += "X-MICROSOFT-CDO-ALLDAYEVENT:FALSE";
	message += "X-MICROSOFT-CDO-IMPORTANCE:1";
	message += "X-MICROSOFT-CDO-INSTTYPE:0";
	message += "X-MICROSOFT-DISALLOW-COUNTER:FALSE";
	message += "SUMMARY:Appointment Reminder\n";
	message += "DESCRIPTION:Test message\n";
	message += "PRIORITY:5\n";
	message += "END:VEVENT\n";
	message += "END:VCALENDAR\n";
	
	fs.writeFile('files/calendar.ics',message,encoding='utf-8',function(err){
		if(err) throw err;
		console.log('It\'s saved!');
	});
	//data.attach_alternative("<html>i <i>hope</i> this works!</html>");
	data.attach_alternative(message);
	data.attach("files/calendar.ics","text/calendar","calendar.ics");
	//data.attach("files/calendar.ics","application/ics","calendar.ics");
	server.send(data,function(err,data){console.log(err || data);});
	res.redirect('/');
});

/*
app.post('/send',function(req,res){
	var subject = req.body.title,target = req.body.reciever,body = req.body.content,message="";
	message += "BEGIN:VCALENDAR";
	message += "METHOD:REQUEST";
	message += "PRODID:Microsoft Exchange Server 2010";
	message += "VERSION:2.0";
	message += "BEGIN:VTIMEZONE";
	message += "TZID:China Standard Time";
	message += "BEGIN:STANDARD";
	message += "DTSTART:16010101T000000";
	message += "TZOFFSETFROM:+0800";
	message += "TZOFFSETTO:+0800";
	message += "END:STANDARD";
	message += "BEGIN:DAYLIGHT";
	message += "DTSTART:16010101T000000";
	message += "TZOFFSETFROM:+0800";
	message += "TZOFFSETTO:+0800";
	message += "END:DAYLIGHT";
	message += "END:VTIMEZONE";
	message += "BEGIN:VEVENT";
	message += "ORGANIZER;CN=祁幽:MAILTO:xj032085@gmail.com";
	message += "ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=淘宝-UED-前端业务支撑-交易&新业务:MAILTO:qiyou.xj@taobao.com";
	message += "ATTACH:CID:0F641F027BEAE1D58C4ADCA8E31E1333B94CF0A8@ali.com";
	message += "DESCRIPTION;LANGUAGE=en-US:由于一些特殊原因，龙客和我们的会议室换了一下，所以辛苦一下大家，这次要到11F 拥翠山庄 开周会，希望大家准时到场，在此附上地图一份，防止大家找不到地方。\n\n\n\n";
	message += "SUMMARY;LANGUAGE=en-US:交易线周会2011-12-28";
	message += "DTSTART;TZID=China Standard Time:20111228T093000";
	message += "DTEND;TZID=China Standard Time:20111228T113000";
	message += "UID:040000008200E00074C5B7101A82E00800000000A0AE2BAF92ACCC01000000000000000010000000CB0EB2E0F1B1F64BBBAB558AF2C4314C";
	message += "CLASS:PUBLIC";
	message += "PRIORITY:5";
	message += "DTSTAMP:20111126T152649Z";
	message += "TRANSP:OPAQUE";
	message += "STATUS:CONFIRMED";
	message += "SEQUENCE:0";
	message += "LOCATION;LANGUAGE=en-US:创业11F 拥翠山庄";
	message += "X-MICROSOFT-CDO-APPT-SEQUENCE:0";
	message += "X-MICROSOFT-CDO-OWNERAPPTID:1205516251";
	message += "X-MICROSOFT-CDO-BUSYSTATUS:TENTATIVE";
	message += "X-MICROSOFT-CDO-INTENDEDSTATUS:BUSY";
	message += "X-MICROSOFT-CDO-ALLDAYEVENT:FALSE";
	message += "X-MICROSOFT-CDO-IMPORTANCE:1";
	message += "X-MICROSOFT-CDO-INSTTYPE:0";
	message += "X-MICROSOFT-DISALLOW-COUNTER:FALSE";
	message += "BEGIN:VALARM";
	message += "ACTION:DISPLAY";
	message += "DESCRIPTION:REMINDER";
	message += "TRIGGER;RELATED=START:-PT15M";
	message += "END:VALARM";
	message += "END:VEVENT";
	message += "END:VCALENDAR";
	smtpc.sendmail({
		"host":"smtp.163.com",
		"from":"xjwsn@163.com",
		"to":target,
		"content":{
			"subject":"Hello Jane",
			"content-type":"text/calendar",
			"content":message
		},
		"success":function(){
			console.log("Sent!");
		},
		"failure":function(err){
			console.log("Error(%d): %s",err.code,err.message);
		}
	});
*/
/*
	email.send({
      host : "smtp.163.com",               // smtp server hostname
      port : "25",                     // smtp server port
      domain : "163.com",             // domain used by client to identify itself to server
      to : target,
      from : "xjwsn@163.com",
      subject : subject,
	  body : body,	// path to template name
      authentication : "login",        // auth login is supported; anything else is no auth
      username : "xjwsn",        // username
      password : "59685713868260"         // password
    },
    function(err, result){
      if(err){ console.log(err); }
    });
*/
/*
	res.redirect('/');
});
*/

try{
	app.listen(3000);
	console.log('blog start!');
}catch(e){
	console.log('Error: ' + e.message);
}

