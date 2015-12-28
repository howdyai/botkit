/*
Tests for storage modules.
This file currently test simple_storage.js and mongo_storage.js.

If you build a new storage module,
you must add it to this test file before your PR will be considered.
How to add it to this test file:

Add the following to the bottom of this file:

// Test <your_storage_module>
<your_storage_module> = require('./<your_storage_module>.js')(<appropriate config object for your storage module>);
check(<your_storage_module>.users);
check(<your_storage_module>.channels);
check(<your_storage_module>.teams);
*/

var test = require('unit.js');

testObj1 = {id: "TEST1", foo:"bar1"};
testObj2 = {id: "TEST2", foo:"bar2"};

var check = function(storageMethod) {
  storageMethod.save(testObj1, function(err) {
    test.assert(!err);
      storageMethod.save(testObj2, function(err) {
      test.assert(!err);
      storageMethod.get(testObj1.id, function(err, data) {
        test.assert(!err);
        console.log(data);
        test.assert(data.foo === testObj1.foo);
      });
      
      storageMethod.all(function(err, data) {
        test.assert(!err);
        console.log(data);
        test.assert(data[0].foo === testObj1.foo);
      });
    });
  });
};

console.log("If no asserts failed then the test has passed!");

// Test simple_storage
simple_storage = require('./simple_storage.js')();
check(simple_storage.users);
check(simple_storage.channels);
check(simple_storage.teams);

// Test mongo_storage
mongo_storage = require('./mongo_storage.js')({mongo_uri: 'mongodb://test:test@ds037145.mongolab.com:37145/slack-bot-test'});
check(mongo_storage.users);
check(mongo_storage.channels);
check(mongo_storage.teams);
