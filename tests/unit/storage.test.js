'use strict';

/*
 * Tests for storage modules.
 * This file currently test simple_storage.js.
 *
 * If you build a new storage module,
 * you must add it to this test file before your PR will be considered.
 */

const mkdirp = require('mkdirp');

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
                    `expected ${ received } to be either null or undefined`,
                pass: false,
            };
        }
    },
});

// Test data
const testObj0 = {id: 'TEST0', foo: 'bar0'};
const testObj1 = {id: 'TEST1', foo: 'bar1'};

describe('Simple Storage', () => {
    // Setup - start with an empty data storage
    let dataDir = __dirname + '/temp/data/';
    mkdirp.sync(dataDir);

    const storage = require('../../lib/storage/simple_storage.js')({path: dataDir});

    ['channels', 'teams', 'users'].forEach((key) => {
        const store = storage[key];

        describe('Has correct methods', () => {

            test(`Interfaces for ${ key }`, () => {
                expect(store).toBeDefined();
                expect(store.save).toBeInstanceOf(Function);
                expect(store.get).toBeInstanceOf(Function);
                expect(store.all).toBeInstanceOf(Function);
                expect(store.delete).toBeInstanceOf(Function);
            });
        });

        describe(`Operations for ${ key }`, () => {
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

            ['TESTX', undefined, null].forEach((id) => {
                test(`Get - data not present (${ typeof id })`, (done) => {
                    store.get(id, (err, data) => {
                        expect(err).toBeTruthy();
                        expect(data).toBeNullOrUndefined();
                        done();
                    });
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

            ['TESTX', undefined, null].forEach((id) => {
                test(`Delete - data not present' (${ typeof id })`, (done) => {
                    store.delete(id, (err, data) => {
                        expect(err).toBeTruthy();
                        expect(data).toBeNullOrUndefined();
                        done();
                    });
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
