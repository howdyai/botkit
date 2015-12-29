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

testObj0 = {id: "TEST0", foo:"bar0"};
testObj1 = {id: "TEST1", foo:"bar1"};

var testStorageMethod = function(storageMethod) {
  storageMethod.save(testObj0, function(err) {
    test.assert(!err);
      storageMethod.save(testObj1, function(err) {
      test.assert(!err);
      storageMethod.get(testObj0.id, function(err, data) {
        test.assert(!err);
        console.log(data);
        test.assert(data.foo === testObj0.foo);
      });
      
      storageMethod.all(function(err, data) {
        test.assert(!err);
        console.log(data);
        test.assert(
          data[0].foo === testObj0.foo && data[1].foo === testObj1.foo ||
          data[0].foo === testObj1.foo && data[1].foo === testObj0.foo
        );
      });
    });
  });
};

console.log("If no asserts failed then the test has passed!");

// Test simple_storage
simple_storage = require('./simple_storage.js')();
testStorageMethod(simple_storage.users);
testStorageMethod(simple_storage.channels);
testStorageMethod(simple_storage.teams);

// Test mongo_storage
mongo_storage = require('./mongo_storage.js')({mongo_uri: 'mongodb://test:test@ds037145.mongolab.com:37145/slack-bot-test'});
testStorageMethod(mongo_storage.users);
testStorageMethod(mongo_storage.channels);
testStorageMethod(mongo_storage.teams);
