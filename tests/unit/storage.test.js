'use strict';

/*
Tests for storage modules.
This file currently test simple_storage.js.

If you build a new storage module,
you must add it to this test file before your PR will be considered.
How to add it to this test file:

Add the following to the bottom of this file:

// Test <your_storage_module>
<your_storage_module> = require('../../lib/storage/<your_storage_module>.js')(<appropriate config object for your storage module>);
check(<your_storage_module>.users);
check(<your_storage_module>.channels);
check(<your_storage_module>.teams);
*/

// Extend expect to include a matcher for null or undefined
expect.extend({
    toBeNullOrUndefined(received) {
        const pass = received === null || received === undefined;
        if (pass) {
            return {
                message: () =>
                  `Ok`,
                pass: true,
            };
        } else {
            return {
                message: () =>
                  `expected ${received} to be either null or undefined`,
                pass: false,
            };
        }
    },
});

// Test data
const testObj0 = {id: 'TEST0', foo: 'bar0'};
const testObj1 = {id: 'TEST1', foo: 'bar1'};

describe('Simple Storage', () => {
    const storage = require('../../lib/storage/simple_storage.js')();

    Object.keys(storage).forEach((key) => {
        const store = storage[key];

        describe('Has correct methods', () => {

            test(`Interfaces for ${key}`, () => {
                expect(store).toBeDefined();
                expect(store.save).toBeInstanceOf(Function);
                expect(store.get).toBeInstanceOf(Function);
                expect(store.all).toBeInstanceOf(Function);
                expect(store.delete).toBeInstanceOf(Function);
            });
        });
    
        describe(`Operations for ${key}`, () => {
            const store = storage[key];

            test('Save', (done) => {
                store.save(testObj0, (err) => {
                    expect(err).toBeNullOrUndefined();
                    store.save(testObj1, (err) => {
                        expect(err).toBeNull();
                        done();
                    });
                });
            });

            test('Get', (done) => {
                store.get(testObj0.id, (err, data) => {
                    expect(err).toBeNullOrUndefined();
                    expect(data).toEqual(testObj0);
                    done();
                });
            });

            test('Get - data not present', (done) => {
                store.get('TESTX', (err, data) => {
                    expect(err).toBeTruthy();
                    expect(data).toBeNullOrUndefined();
                    done();
                });
            });

            test('All', (done) => {
                store.all((err, data) => {
                    expect(err).toBeNullOrUndefined();
                    expect(data).toEqual([testObj0, testObj1]);
                    done();
                });
            });

            test('Delete', (done) => {
                store.delete(testObj1.id, (err) => {
                    expect(err).toBeNullOrUndefined();
                    store.all((err, data) => {
                        expect(err).toBeNull();
                        expect(data).toEqual([testObj0]);
                        done();
                    });
                });
            });

            test('Delete - data not present', (done) => {
                store.get('TESTX', (err) => {
                    expect(err).toBeTruthy();
                    done();
                });
            });

            test('Overwrite', (done) => {
                const overwriteObject = {id: 'TEST0', foo: 'CHANGED'};
                store.save(overwriteObject, (err) => {
                    expect(err).toBeNullOrUndefined();
                    store.get(testObj0.id, (err, data) => {
                        expect(err).toBeNullOrUndefined();
                        expect(data).toEqual(overwriteObject);
                        done();
                    });
                });
            });

        });

    });

});
