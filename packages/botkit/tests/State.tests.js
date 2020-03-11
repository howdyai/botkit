const assert = require('assert');
const { BotkitConversationState } = require('../lib/conversationState');
const { MemoryStorage } = require('botbuilder');

const storage = new MemoryStorage();
const state = new BotkitConversationState(storage);

describe('BotkitConversationState', function() {
    it('should generate appropriate state key', function() {
        const key = state.getStorageKey({
            activity: {
                channelId: 'test',
                from: {
                    id: 'foo'
                },
                conversation: {
                    id: 'bar'
                }
            }
        });
        assert(key === 'test/conversations/bar-foo/', 'failed key gen');
    });
    it('should generate appropriate state key excluding properties field', function() {
        const key = state.getStorageKey({
            activity: {
                channelId: 'test',
                from: {
                    id: 'foo'
                },
                conversation: {
                    properties: {
                        baz: true
                    },
                    id: 'bar'
                }
            }
        });
        assert(key === 'test/conversations/bar-foo/', 'failed key gen');
    });
    it('should generate appropriate state key including platform field', function() {
        const key = state.getStorageKey({
            activity: {
                channelId: 'test',
                from: {
                    id: 'foo'
                },
                conversation: {
                    threadId: '5',
                    channel: '9',
                    id: 'bar'
                }
            }
        });
        assert(key === 'test/conversations/9-bar-5-foo/', 'failed key gen');
    });
});
