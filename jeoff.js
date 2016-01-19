/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
          \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
           \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    token=<MY TOKEN> node bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Say: "shutdown"

  The bot will ask if you are sure, and then shut itself down.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit is has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

var Botkit = require('./lib/Botkit.js')
var os = require('os');

var controller = Botkit.slackbot({
  debug: false,
  json_file_store: 'storage'
});

var bot = controller.spawn(
  {
    token:process.env.token
  }
).startRTM();

controller.hears(['That is correct, (.+)\.'],'direct_message,ambient',function(bot,message) {
  console.log("heard correct")
  var matches = message.text.match(/That is correct, (.+)\./);
  if (matches == null) {
    return;
  }
  var name = matches[1];
  controller.storage.users.get(name,function(err,user) {
    if (!user) {
      user = {
        id: message.name,
        correct: 1,
        incorrect: 0
      } 
      controller.storage.users.save(user, function(err,id) {
      })
    } else {
      user.correct = user.correct + 1
      controller.storage.users.save(user, function(err,id) {
      })
    }
  })
})

controller.hears(['That is incorrect, (.+)\.'],'direct_message,ambient',function(bot,message) {
  console.log("heard correct")
  var matches = message.text.match(/That is incorrect, (.+)\./);
  if (matches == null) {
    return;
  }
  var name = matches[1];
  controller.storage.users.get(name,function(err,user) {
    if (!user) {
      user = {
        id: message.name,
        correct: 0,
        incorrect: 1
      } 
      controller.storage.users.save(user, function(err,id) {
      })
    } else {
      user.incorrect = user.incorrect + 1
      controller.storage.users.save(user, function(err,id) {
      })
    }
  })
})

controller.hears(['stats (.+)'],'direct_message,direct_mention,mention,ambient',function(bot,message) {
  console.log("heard stats")

  var matches = message.text.match(/stats (.+)/);
  if (matches == null) {
    return;
  }
  var name = matches[1];
  controller.storage.users.get(name,function(err,user) {
    if (!user) {
      bot.reply(message, name + " hasn't answered any questions yet!")
    } else {
      bot.reply(message, construct_stats_str(name,user.correct, user.incorrect))
    }
  })
})

function construct_stats_str(user, correct, incorrect) {
  var ratio
  if (incorrect + correct > 0)
  {
    ratio = "(" + (correct * 100 / (correct + incorrect)).toFixed(2) + "% correct)"
  } else {
    ratio = ""
  }
  return user + " has answered " + correct + " correctly, and " + incorrect + " incorrectly. " + ratio+ "\n";
}

controller.hears(['^statsall$'],'direct_message,direct_mention,mention,ambient',function(bot,message) {
  console.log("heard statsall")

  controller.storage.users.all(function(err,users) {
    if (!users) {
      bot.reply(message, "Nobody has answered any questions yet!");
    } else {
      var reply_str = ""
      for (i in users) //i is the string key for the map ojb
      {
        reply_str += construct_stats_str(i, users[i].correct, users[i].incorrect);
      }
      bot.reply(message, reply_str);
    }
  })
})


controller.hears(['reset (.+)'],'direct_message,direct_mention,mention,ambient',function(bot,message) {
  console.log("heard stats")

  var matches = message.text.match(/reset (.+)/);
  if (matches == null) {
    return;
  }
  var name = matches[1];
  controller.storage.users.get(name,function(err,user) {
    if (!user) {
      bot.reply(message, name + " hasn't answered any questions yet!");
    } else {
      reset_stats(name)
      bot.reply(message, "reset " + name + "'s stats");
    }
  })
})

controller.on('bot_message',function(bot,message) {

  console.log("heard: " + message.text)
  var name
  var matches = message.text.match(/That is incorrect, (.+)\. /)
  if (matches != null) {
    name = matches[1]
    if (name) {
      increment_incorrect(name)
    }
    return
  } 
  matches = message.text.match(/That is correct, (.+)\. Your total score is/);
  if (matches != null) {
    name = matches[1]
    if (name) {
      increment_correct(name)
    }
    return
  }
})

function increment_incorrect(name)
{
  controller.storage.users.get(name,function(err,user) {
    if (!user) {
      user = {
        id: name,
        correct: 0,
        incorrect: 1
      } 
      controller.storage.users.save(user, function(err,id) {
      })
    } else {
      user.incorrect = user.incorrect + 1
      controller.storage.users.save(user, function(err,id) {
      })
    }
  })
}

function increment_correct(name)
{
  controller.storage.users.get(name,function(err,user) {
    if (!user) {
      user = {
        id: name,
        correct: 1,
        incorrect: 0
      } 
      controller.storage.users.save(user, function(err,id) {
      })
    } else {
      user.correct = user.correct + 1
      controller.storage.users.save(user, function(err,id) {
      })
    }
  })
}

function reset_stats(name)
{
  user = {
    id: name,
    correct: 0,
    incorrect: 0
  } 
  controller.storage.users.save(user, function(err,id) {
  })
}