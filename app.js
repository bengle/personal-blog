var express = require('express');
var fs = require('fs');
//var mongoose = require('mongoose');
//var Schema = mongoose.Schema,
	//ObjectId = Schema.ObjectId;
//var email = require('mailer');
var smtpc = require('smtpc'),mail;
//var email = require('emailjs');
//var mail = require('module/calendar.js').Email;

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
app.get('/mail',function(req,res){
	res.render('mail');
});
app.get('/',function(req,res){
	res.render('index');
});

app.post('/send',function(req,res){

	var message = "";
	message += "BEGIN:VCALENDAR\n";
	message += "METHOD:REQUEST\n";
	message += "PRODID:Microsoft Exchange Server 2010\n";
	message += "VERSION:2.0\n";
	message += "BEGIN:VTIMEZONE\n";
	message += "TZID:China Standard Time\n";
	message += "BEGIN:STANDARD\n";
	message += "DTSTART:16010101T000000\n";
	message += "TZOFFSETFROM:+0800\n";
	message += "TZOFFSETTO:+0800\n";
	message += "END:STANDARD\n";
	message += "BEGIN:DAYLIGHT\n";
	message += "DTSTART:16010101T000000\n";
	message += "TZOFFSETFROM:+0800\n";
	message += "TZOFFSETTO:+0800\n";
	message += "END:DAYLIGHT\n";
	message += "END:VTIMEZONE\n";
	message += "BEGIN:VEVENT\n";
	message += "ORGANIZER:MAILTO: qiyou.xj@taobao.com\n";
	message += "DTStart:" + Date.parse(2011,12,20,14,30,00) + "\n";
	message += "DTEnd:" + Date.parse(2011,12,20,16,30,00) + "\n";
	message += "Location;ENCODING=QUOTED-PRINTABLE: My home\n";
	message += "UID:"+Date.parse(2011,12,20,14,30,00)+Date.parse(2011,12,20,16,30,00) + "\n";
	message += "ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=淘宝-UED-前端业务支撑-交易&新业务:MAILTO:qiyou.xj@taobao.com\n";
	message += "ATTACH:CID:0F641F027BEAE1D58C4ADCA8E31E1333B94CF0A8@ali.com\n";
	message += "CLASS:PUBLIC\n";
	message += "PRIORITY:5\n";
	message += "DTSTAMP:20111126T152649Z\n";
	message += "TRANSP:OPAQUE\n";
	message += "STATUS:CONFIRMED\n";
	message += "SEQUENCE:0\n";
	message += "X-MICROSOFT-CDO-APPT-SEQUENCE:0\n";
	message += "X-MICROSOFT-CDO-OWNERAPPTID:1205516251\n";
	message += "X-MICROSOFT-CDO-BUSYSTATUS:TENTATIVE\n";
	message += "X-MICROSOFT-CDO-INTENDEDSTATUS:BUSY\n";
	message += "X-MICROSOFT-CDO-ALLDAYEVENT:FALSE\n";
	message += "X-MICROSOFT-CDO-IMPORTANCE:1\n";
	message += "X-MICROSOFT-CDO-INSTTYPE:0\n";
	message += "X-MICROSOFT-DISALLOW-COUNTER:FALSE\n";
	message += "SUMMARY:Appointment Reminder\n";
	message += "DESCRIPTION:Test message\n";
	message += "PRIORITY:5\n";
	message += "END:VEVENT\n";
	message += "END:VCALENDAR\n";

	fs.writeFile('files/calendar.ics',message,encoding='utf-8',function(err){
		if(err) throw err;
		console.log('It\'s saved!');
	});

	mail = smtpc.sendmail({
		'host' : 'smtp.gmail.com',
		'auth' : ['xj032085','59685713868260'],
		'from' : 'xj032085@gmail.com',
		'to'	: 'qiyou.xj@taobao.com',
		'content' : {
			'from' : 'xujie',
			'to' : 'test',
			'subject' : 'hello',
			'content-type' : 'multipart/alternative',
			'content' : [{
				'content-type' : 'text/plain',
				'content' : 'Hello world!'
			},{
				'content-type' : 'text/calendar',
				'content' : message
			}]
		},
		"success"	: function () {
			console.log("sent!");
			process.exit(0);
		},
		"failure"	: function (err) {
			if (err.code) {
				console.log("Error(%s): %s", err.email, err.message);
				return;
			}
			console.log("Error(%d): %s", err.code, err.message);
			process.exit(1);
	}
	});

/*
	var headers = {
		text:"i hope this works",
		from:"qiyou<xj032085@gmail.com>",
		to:"haha<qiyou.xj@taobao.com>",
		//to:"haha<qiyou.xj@taobao.com>",
		subject:"testing emailjs"
	};
	var data = email.calender.create(headers);
	
	
	fs.writeFile('files/calendar.ics',message,encoding='utf-8',function(err){
		if(err) throw err;
		console.log('It\'s saved!');
	});
	//data.attach_alternative("<html>i <i>hope</i> this works!</html>");
	data.attach_alternative(message);
	//data.attach("files/calendar.ics","text/calendar","calendar.ics");
	data.attach("files/calendar.ics","application/ics","calendar.ics");
	server.send(data,function(err,data){console.log(err || data);});
*/
	res.redirect('/');
});

try{
	app.listen(3005);
	console.log('blog start!');
}catch(e){
	console.log('Error: ' + e.message);
}
