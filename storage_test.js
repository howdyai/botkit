var storage = require('./simple_storage.js')({
  path: "./db/",
})


storage.users.get('123',function(err,user) {

    console.log('tried to get fake user',err,user);
})

storage.teams.save({
  id: '1234',
  'name': 'howdy team 2',
},function(err,id) {

    if (err) {
      console.log('ERROR',err);
    } else {
      console.log('SUCCESS',id);
    }
})


storage.teams.all(function(err,teams) {

  for (var t in teams) {
    console.log(teams[t].name);
  }

})
