const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
var bodyParser = require('body-parser');

try{
mongoose.connect("mongodb+srv://dev:1122@cluster0.jzo9e.mongodb.net/FreeCodeCamp?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Conectado")
}catch(err){
  console.log("No fue posible")
}

//schemas
const Schema = mongoose.Schema;

const exerciseSchema = new Schema({
  userId: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date,
});

const userSchema = new Schema({
  username: { type: String, required: true },
});

const Exercise = mongoose.model("Exercise", exerciseSchema);
const User = mongoose.model("User", userSchema);

async function getExercisesFromUserWithId(id) {
  await Exercise.find({ "userId": id }, function(err, data){
        if(err){
          console.log("error exce")
        }else{
          let MyLogs = data
          const logs = MyLogs.map((l) => ({
            description: l.description,
            duration: l.duration,
            date: l.date.toDateString()
          }))
          
          return logs;
        }
  })
}

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(bodyParser.urlencoded({extended: false}));

// Print to the console information about each request made
app.use((req, res, next) => {
  console.log("method: " + req.method + "  |  path: " + req.path + "  |  IP - " + req.ip);
  next();
});

app.post('/api/users', (req, res) => {
  let username = req.body.username; 

  if(username){
    const user = new User({username: username});
    user.save(function(err, data) {
    if (err) return console.error(err);
      res.json({username: data.username, _id : data._id})
    });
  }else{
    res.json({error: "User null"})
  }
  
})

app.get('/api/users', (req, res) => {
  User.find(function(err, data) {
    if (err) return console.error(err);
    res.json(data)
  });
})

app.post('/api/users/:_id/exercises', (req, res) => {
  const id = req.params._id;
  
  const {description, duration, date} = req.body;
  User.findById(id, (err, dataUser) => {
    if(err || !dataUser){
      res.send("Could not find user");
    }else{

      if(!date){
        let newDate = new Date(Date.now())
      }
      const newExercise = new Exercise({
        userId: id, 
        description, 
        duration, 
        date: new Date(date)
      })
      newExercise.save((err, data) => {
        if(err || !data){
          res.send("error new exercise")
        }else{
          const {description, duration, date, _id} = data;
          res.json({
            username: dataUser.username, 
            description, 
            duration, 
            date: date.toDateString(), 
            _id: id
          });
        }
      })
    }
  })
})

app.get('/api/users/:id/logs', (req, res) => {
  const userId = req.params.id;
  var from = req.query.from;
  var to = req.query.to;
  var limit = req.query.limit;
  
  User.findById(userId,function(err, userData) {
    if (err) {
      return console.error(err)
    }else{
      Exercise.find({ "userId": userId }, function(err, data){
        if(err){
          console.log("error exce")
        }else{
          let MyLogs = data
          let log = MyLogs.map((l) => ({
            description: l.description,
            duration: l.duration,
            date: l.date.toDateString()
          }))

          if(from){
            const fromDate = new Date(from);
            log = log.filter(exe => new Date(exe.date) >= fromDate);
          }
          if(to){
            const toDate = new Date(to);
            log = log.filter(exe => new Date(exe.date) <= toDate);
          }
          if(limit){
            log = log.slice(0, +limit);
          }

          res.json({
            username: userData.username, 
            count: log.length, 
            _id: userId,
            log
          })
        }
      })
    }
  })
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
