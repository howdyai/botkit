


var base = function() {

  this.responders = [];

  this.new = function(token) {

    this.responders.push(new responder_class(token));

  }

  this.test = function() {

    for (var x = 0; x < this.responders.length; x++) {
      this.responders[x].say('Testing!');
    }
  }


}

var responder = function(token) {

  this.token = token;

  this.say = function(msg) {
    console.log(this.token,'says',msg);

  }

}



var foo = new base();

foo.new('123');
foo.new('457');

foo.test();
