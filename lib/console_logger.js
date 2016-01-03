var slice = Array.prototype.slice;
/**
 * RFC 5424 syslog severity levels, see
 * https://tools.ietf.org/html/rfc5424#section-6.2.1
 */
var levels = [
    'emergency',
    'alert',
    'critical',
    'error',
    'warning',
    'notice',
    'info',
    'debug'
];
var levelsByName = levels.reduce(function(out, name, index) {
    out[name] = index;
    return out;
}, {});

function normalizeLogLevel(level) {
    if (typeof level === 'string') {
        level = levelsByName[level];
    }
    if (typeof level === 'number' && level >= 0 && level < levels.length) {
        return level;
    }
    return false;
}

function ConsoleLogger(_console, maxLevel, defaultLevel) {
    _console = _console || console;
    maxLevel = normalizeLogLevel(maxLevel) || 6;
    defaultLevel = normalizeLogLevel(defaultLevel) || 6;
    return {
        log: function(level, message) {
            var normalizedLevel = normalizeLogLevel(level);
            if (!normalizedLevel) {
                message = level;
                normalizedLevel = defaultLevel;
            }
            var levelName = levels[normalizedLevel];
            if (normalizedLevel <= maxLevel) {
                _console.log.apply(
                    _console,
                    [levelName + ': ' + message].concat(slice.call(arguments, 2))
                );
            }
        }
    };
}

ConsoleLogger.LogLevels = levelsByName;

module.exports = ConsoleLogger;
