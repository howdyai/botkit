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

    describe('Has correct methods', () => {

        test('Channels interfaces', () => {
            expect(storage.channels).toBeDefined();
            expect(storage.channels.save).toBeInstanceOf(Function);
            expect(storage.channels.get).toBeInstanceOf(Function);
            expect(storage.channels.all).toBeInstanceOf(Function);
            expect(storage.channels.delete).toBeInstanceOf(Function);
        });

        test('Teams interfaces', () => {
            expect(storage.teams).toBeDefined();
            expect(storage.teams.save).toBeInstanceOf(Function);
            expect(storage.teams.get).toBeInstanceOf(Function);
            expect(storage.teams.all).toBeInstanceOf(Function);
            expect(storage.teams.delete).toBeInstanceOf(Function);
        });

        test('Users interfaces', () => {
            expect(storage.users).toBeDefined();
            expect(storage.users.save).toBeInstanceOf(Function);
            expect(storage.users.get).toBeInstanceOf(Function);
            expect(storage.users.all).toBeInstanceOf(Function);
            expect(storage.users.delete).toBeInstanceOf(Function);
        });

    });

    describe('Channels operations', () => {
        const store = storage.channels;

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

    describe('Teams operations', () => {
        const store = storage.teams;

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

    describe('Users operations', () => {
        const store = storage.users;

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
