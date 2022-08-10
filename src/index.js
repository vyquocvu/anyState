"use strict";
exports.__esModule = true;
exports.createAnyState = void 0;
var Immutable = function (initialized) {
    var object = JSON.parse(JSON.stringify(initialized));
    return object;
};
Immutable.getIn = function (state, keys) {
    var cursor = state;
    keys.forEach(function (key) {
        if (cursor === undefined) {
            return;
        }
        cursor = cursor[key];
    });
    return cursor;
};
Immutable.setIn = function (state, paths, value) {
    var cursor = state;
    var cloneValue = value;
    if (typeof value === 'object') {
        cloneValue = Immutable(value);
    }
    paths.forEach(function (path, index) {
        if (cursor === undefined) {
            return;
        }
        if (index === paths.length - 1) {
            cursor[path] = cloneValue;
        }
        else {
            cursor = cursor[path];
        }
    });
    return state;
};
Immutable.asMutable = function (value) {
    if (typeof value === 'object') {
        return JSON.parse(JSON.stringify(value));
    }
    return value;
};
/**
 * @param {string} path
 * @returns {Key[]}
 */
var getPaths = function (path) {
    return path.split(/\[|\]|\./g)
        .reduce(function (acc, curr) {
        if (curr === '' || curr === null || curr === undefined) {
            return acc;
        }
        if (/^\d+$/.test(curr)) {
            acc.push(parseInt(curr, 10));
        }
        else {
            acc.push(curr);
        }
        return acc;
    }, []);
};
/**
 * @param {Key[]} paths
 * @returns {string}
*/
var getIdPath = function (paths) {
    return paths.join('/');
};
var AnyState = function () {
    var state = null;
    var watchers = [];
    /**
     *
     * @returns {any}
     */
    var getState = function () {
        return Immutable.asMutable(state);
    };
    /**
     *
     * @param newState: { [key: string]: any }
     * @returns {void}
     */
    var setState = function (newState) {
        state = Immutable(newState);
        watchers.forEach(function (watcher) { return watcher.callback(state, newState); });
    };
    /**
     *
     * @param key {string}
     * @param value
     */
    var setItem = function (key, value) {
        var paths = [];
        var shallowState = Immutable(state);
        var idPath = '';
        if (!Array.isArray(key) && typeof key !== 'string' && typeof key !== 'number') {
            throw new Error('setItem: key must be a string or an array of strings');
        }
        if (!state) {
            throw new Error('State is not initialized');
        }
        if (typeof key === 'string') {
            paths = getPaths(key);
        }
        else if (typeof key === 'number') {
            paths = [key];
        }
        else if (Array.isArray(key)) {
            paths = key;
        }
        idPath = getIdPath(paths);
        if (Immutable.getIn(state, paths) === undefined) {
            console.warn("Trying to set item ".concat(key, " but it doesn't exist"));
        }
        state = Immutable.setIn(state, paths, value);
        watchers.forEach(function (watcher) {
            // if the watcher is watching the same path as the item being set
            // children of the path will also be updated
            if (watcher && watcher.key.indexOf(idPath) === 0) {
                var prevValue = Immutable.getIn(shallowState, watcher.paths);
                var nextValue = Immutable.getIn(state, watcher.paths);
                if (typeof prevValue !== typeof nextValue) {
                    console.warn("Type mismatch for ".concat(key));
                }
                watcher.callback(nextValue, prevValue);
            }
        });
    };
    /**
     *
     * @param path {string}
     * @returns
     */
    var getItem = function (path) {
        var paths = path;
        var item = undefined;
        if (!Array.isArray(path) && typeof path !== 'string' && typeof path !== 'number') {
            throw new Error('setItem: key must be a string or an array of strings');
        }
        if (typeof path === 'string') {
            paths = getPaths(path);
        }
        item = Immutable.getIn(state, paths);
        return Immutable.asMutable(item);
    };
    /**
     *
     * @param key {string}
     * @param callback {(state, prevState) => void}
     */
    var watch = function (key, callback) {
        if (!state) {
            throw new Error('State is not initialized');
        }
        if (typeof callback !== 'function') {
            throw new Error('callback must be a function');
        }
        var paths = getPaths(key);
        if (Immutable.getIn(state, paths) === undefined) {
            console.warn("Trying to watch item ".concat(key, " but it doesn't exist"));
        }
        var id = getIdPath(paths);
        watchers.push({ key: id, callback: callback, paths: paths });
    };
    return {
        setState: setState,
        setItem: setItem,
        getState: getState,
        getItem: getItem,
        watch: watch
    };
};
var createAnyState = function (initialState) {
    var state = Immutable(initialState);
    var anyState = AnyState();
    anyState.setState(state);
    return anyState;
};
exports.createAnyState = createAnyState;
