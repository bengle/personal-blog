var express = require('express');
var fs = require('fs');
var mongoose = require('mongoose');
var Schema = mongoose.Schema,
	ObjectId = mongoose.ObjectId;
mongoose.connect('mongodb://127.0.0.1:27017/blog');

var blogPost = new Schema({
			title: ObjectId,
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
app.configure('development',function(){
	//app.use(express.errorHandler({dumpException:true,'showStack':true}));
	//log('Warning:Server in Development Mode, add NODE_ENV=production',true);
});
app.configure('production',function(){
	//app.use(express.errorHandler());
	//log('Production Mode');
});

app.set('view options',{layout:false});

//var routes = JSON.parse(fs.readFileSync('router.json','utf-8').substr(1));

/*
var startRouter = function(path){
	app.get(route, function(req,res){
		//console.log('connect to ' + path);
		var page = info[routes[path].data];
		res.render(routes[path].template.page);
	});
};
*/

//for(route in routes){
//	startRouter(route);
//}


var blogPost = mongoose.model('blogPost',blogPost);
var post = new blogPost();


app.get('/',function(req,res){
	res.render('index',{title:'this is a test!'});
});

//app.use('/blog',require(./blog.js));


// add blog
app.get('/new',function(req,res){
	res.render('new',{title:'add a new blog'});
});

// save blog
app.post('/add',function(req,res){
	post.title = req.body.title;
	post.body = req.body.content;
	post.date = new Date();

	post.save(function(err){
		if(err){
			console.log('save faile!');
		}else {
			console.log('save success!');
			res.render('list',{title:'blog list'});
		}
	});
});

// blog list


// delete blog

app.listen(3000);
console.log('blog server start!');
