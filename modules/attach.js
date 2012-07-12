
var stream     = require('stream');
var util       = require('util');
var fs         = require('fs');
var os         = require('os');
var path       = require('path');
var CRLF       = "\r\n";
var MIMECHUNK  = 76; // MIME standard wants 76 char chunks when sending out.
var counter    = 0;

var generate_boundary = function()
{
   var text       = "";
   var possible    = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'()+_,-./:=?";

   for(var i=0; i < 69; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

   return text;
}

var calendar = function(headers)
{
   this.attachments   = [];
   this.html         = null;
   this.header         = {"calendar-id":"<" + (new Date()).getTime() + "." + (counter++) + "." + process.pid + "@" + os.hostname() +">"};
   //this.content      = "text/plain; charset=utf-8";
   this.content      = "text/calendar; charset=utf-8";

   for(var header in headers)
   {
      // allow user to override default content-type to override charset or send a single non-text calendar
      if(/^content-type$/i.test(header))
      {
         this.content = headers[header];
      }
      else if(header == 'text')
      {
         this.text = headers[header];
      }
      else
      {
         // allow any headers the user wants to set??
         // if(/cc|bcc|to|from|reply-to|sender|subject|date|calendar-id/i.test(header))
         this.header[header.toLowerCase()] = headers[header];
      }
   }
};

calendar.prototype = 
{

   attach: function(path, type, name)
   {
      this.attachments.push({path:path, type:type, name:name});
      return this;
   },

   attach_alternative: function(html, charset)
   {
      this.html = {calendar:html, charset:charset || "utf-8"};
      return this;
   },

   valid: function(callback)
   {
      var self = this;

      if(!self.header.from)
      {
         callback(false, "calendar does not have a valid sender");
      }
      if(!self.header.to)
      {
         callback(false, "calendar does not have a valid recipient");
      }
      else if(self.attachments.length === 0)
      {
         callback(true);
      }
      else
      {
         var failed = [];

         self.attachments.forEach(function(attachment, index)
         {
            path.exists(attachment.path, function(exists)
            {
               if(!exists)
                  failed.push(attachment.path + " does not exist");

               if(index + 1 == self.attachments.length)
                  callback(failed.length === 0, failed.join(", "));
            });
         });
      }
   },

   stream: function()
   {
      return new calendarStream(this);
   },

   read: function(callback)
   {
      var buffer = "";

      var capture = function(data)
      {
         buffer += data;
      };

      var output = function(err)
      {
         callback(err, buffer);
      };

      var str = this.stream();

      str.on('data', capture);
      str.on('end', output);
      str.on('error', output);
   }
};

var calendarStream = function(calendar)
{
   var self         = this;

   stream.Stream.call(self);

   self.calendar   = calendar;
   self.readable  = true;
   self.resume    = null;
   self.paused    = false;
   self.stopped   = false;
   self.stream    = null;

   var output_process = function(next)
   {
      var check = function()
      {
         if(self.stopped)
            return;

         else if(self.paused)
            self.resume = next;

         else
            next();
      };

      process.nextTick(check);
   };

   var output_mixed = function()
   {
      var data       = [];
      var boundary   = generate_boundary();

      self.emit('data', ["Content-Type: multipart/mixed; boundary=\"", boundary, "\"", CRLF, CRLF].join(""));
      output_process(function() { output_calendar(-1, boundary); });
   };

   var output_calendar = function(index, boundary)
   {
      var next = function()
      {
         output_process(function() { output_calendar(index + 1, boundary); });
      };

      if(index < 0)
      {
         self.emit('data', ["--", boundary, CRLF].join(""));

         if(self.calendar.html)
         {
            output_process(function() { output_alternatives(next); });
         }
         else
         {
            output_text(next);
         }
      }
      else if(index < self.calendar.attachments.length)
      {
         self.emit('data', ["--", boundary, CRLF].join(""));
         output_process(function() { output_attachment(self.calendar.attachments[index], next); });
      }
      else
      {
         self.emit('data', ["--", boundary, "--", CRLF, CRLF].join(""));
         self.emit('end');
      }
   };

   var output_alternatives = function(next)
   {
      var boundary   = generate_boundary();

      self.emit('data', ["Content-Type: multipart/alternative; boundary=\"", boundary, "\"", CRLF, CRLF].join(""));
      self.emit('data', ["--", boundary, CRLF].join(""));

      output_text(function(){});

      var data = ["--", boundary, CRLF];

      data = data.concat(["Content-Type:text/html; charset=", self.calendar.html.charset, CRLF, "Content-Transfer-Encoding: base64", CRLF]);
      data = data.concat(["Content-Disposition: inline", CRLF, CRLF]);

      self.emit('data', data.join(""));

      output_chunk(new Buffer(self.calendar.html.calendar).toString("base64"));

      self.emit('data', [CRLF, "--", boundary, "--", CRLF, CRLF].join(""));
      next();
   };

   var output_attachment = function(attachment, next)
   {
      var data = ["Content-Type: ", attachment.type, CRLF, "Content-Transfer-Encoding: base64", CRLF];
      data     = data.concat(["Content-Disposition: attachment; filename=\"", attachment.name, "\"", CRLF, CRLF]);

      self.emit('data', data.join(""));
      
      var chunk      = MIMECHUNK*25*3; // 5700
      var buffer     = new Buffer(chunk);
      var opened     = function(err, fd)
      {
         if(!err)
         {
            var read = function(err, bytes)
            {
               if(self.paused)
               {
                  self.resume = function() { read(err, bytes); };
               }
               else if(self.stopped)
               {
                  fs.close(fd);
               }
               else if(!err)
               {
                  var data    = buffer.toString("base64", 0, bytes);
                  var leftover= data.length % MIMECHUNK;
                  output_chunk(data);

                  if(bytes == chunk) // gauranteed no leftovers
                  {
                     fs.read(fd, buffer, 0, chunk, null, read);
                  }
                  else
                  {
                     self.emit('data', leftover ? data.substr(-leftover) + CRLF + CRLF : CRLF); // important!
                     fs.close(fd, next);
                  }
               }
               else
               {
                  fs.close(fd);
                  self.emit('error', err);
               }
            };

            fs.read(fd, buffer, 0, chunk, null, read);
         }
         else
            self.emit('error', err);
      };

      fs.open(attachment.path, 'r+', opened);
   };

   var output_chunk = function(data)
   {
      var loops   = Math.round(data.length / MIMECHUNK);

      for(var step = 0; step < loops; step++)
      {
         self.emit('data', data.substring(step*MIMECHUNK, MIMECHUNK*(step + 1)) + CRLF);
      }
   };

   var output_text = function(next)
   {
      var data = ["Content-Type:", self.calendar.content, CRLF, "Content-Transfer-Encoding: 7bit", CRLF];
      data = data.concat(["Content-Disposition: inline", CRLF, CRLF]);
      data = data.concat([self.calendar.text || "", CRLF, CRLF]);

      self.emit('data', data.join(""));
      next();
   };

   var output_data = function()
   {
      // are there attachments or alternatives?
      if(self.calendar.attachments.length || self.calendar.html)
      {
         self.emit('data', "MIME-Version: 1.0" + CRLF);
         output_process(output_mixed);
      }

      // otherwise, you only have a text calendar
      else
      {
         output_text(function() { self.emit('end'); });
      }
   };

   var output_header = function()
   {
      var data = [];

      for(var header in self.calendar.header)
      {
         // do not output BCC in the headers...
         if(!(/bcc/i.test(header)))
            data = data.concat([header, ": ", self.calendar.header[header], CRLF]);
      }

      self.emit('data', data.join(''));
      output_process(output_data);
   };

   output_process(output_header);
   return;
};

calendarStream.prototype.pause = function()
{
   self.paused = true;
};

calendarStream.prototype.resume = function()
{
   self.paused = false;

   if(self.resume)
   {
      var resume   = self.resume;
      self.resume = null;
      resume();
   }
};

calendarStream.prototype.destroy = function()
{
   self.stopped = true;
};

calendarStream.prototype.destroySoon = function()
{
   self.stopped = true;
};

util.inherits(calendarStream, stream.Stream);

exports.calendar = calendar;
exports.create = function(headers) 
{
   return new calendar(headers);
};
