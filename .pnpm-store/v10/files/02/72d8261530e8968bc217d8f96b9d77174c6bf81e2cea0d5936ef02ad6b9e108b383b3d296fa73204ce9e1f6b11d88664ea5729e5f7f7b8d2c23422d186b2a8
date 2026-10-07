'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

require('core-js/modules/es.reflect.construct.js');
var _classCallCheck = require('@babel/runtime/helpers/classCallCheck');
var _createClass = require('@babel/runtime/helpers/createClass');
var _assertThisInitialized = require('@babel/runtime/helpers/assertThisInitialized');
var _inherits = require('@babel/runtime/helpers/inherits');
var _possibleConstructorReturn = require('@babel/runtime/helpers/possibleConstructorReturn');
var _getPrototypeOf = require('@babel/runtime/helpers/getPrototypeOf');
var _defineProperty = require('@babel/runtime/helpers/defineProperty');
var _typeof = require('@babel/runtime/helpers/typeof');
require('core-js/modules/es.array.is-array.js');
require('core-js/modules/es.regexp.exec.js');
require('core-js/modules/es.string.replace.js');
require('core-js/modules/es.string.pad-start.js');
require('core-js/modules/es.date.to-string.js');
require('core-js/modules/es.object.to-string.js');
require('core-js/modules/es.regexp.to-string.js');
require('core-js/modules/es.promise.js');
require('core-js/modules/es.number.is-finite.js');
require('core-js/modules/es.number.constructor.js');
require('core-js/modules/es.string.repeat.js');
require('core-js/modules/es.object.assign.js');
require('core-js/modules/es.array.iterator.js');
require('core-js/modules/es.string.iterator.js');
require('core-js/modules/es.weak-map.js');
require('core-js/modules/web.dom-collections.iterator.js');
require('core-js/modules/es.weak-set.js');
require('core-js/modules/es.array.map.js');
require('core-js/modules/es.number.is-integer.js');
require('core-js/modules/es.array.join.js');
require('core-js/modules/es.date.to-json.js');
require('core-js/modules/web.url.to-json.js');
require('core-js/modules/es.array.includes.js');
require('core-js/modules/es.string.includes.js');
require('core-js/modules/es.array.concat.js');
require('core-js/modules/es.object.keys.js');
require('core-js/modules/es.array.index-of.js');
require('core-js/modules/es.array.splice.js');
require('core-js/modules/web.immediate.js');
require('core-js/modules/es.array.filter.js');
var stream = require('stream');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _classCallCheck__default = /*#__PURE__*/_interopDefaultLegacy(_classCallCheck);
var _createClass__default = /*#__PURE__*/_interopDefaultLegacy(_createClass);
var _assertThisInitialized__default = /*#__PURE__*/_interopDefaultLegacy(_assertThisInitialized);
var _inherits__default = /*#__PURE__*/_interopDefaultLegacy(_inherits);
var _possibleConstructorReturn__default = /*#__PURE__*/_interopDefaultLegacy(_possibleConstructorReturn);
var _getPrototypeOf__default = /*#__PURE__*/_interopDefaultLegacy(_getPrototypeOf);
var _defineProperty__default = /*#__PURE__*/_interopDefaultLegacy(_defineProperty);
var _typeof__default = /*#__PURE__*/_interopDefaultLegacy(_typeof);

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf__default["default"](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default["default"](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default["default"](this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var rxEscapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g; // table of character substitutions

var meta = {
  '\b': '\\b',
  '\t': '\\t',
  '\n': '\\n',
  '\f': '\\f',
  '\r': '\\r',
  '"': '\\"',
  '\\': '\\\\'
};

function isReadableStream(value) {
  return typeof value.read === 'function' && typeof value.pause === 'function' && typeof value.resume === 'function' && typeof value.pipe === 'function' && typeof value.once === 'function' && typeof value.removeListener === 'function';
}

var Types;

(function (Types) {
  Types[Types["Array"] = 0] = "Array";
  Types[Types["Object"] = 1] = "Object";
  Types[Types["ReadableString"] = 2] = "ReadableString";
  Types[Types["ReadableObject"] = 3] = "ReadableObject";
  Types[Types["Primitive"] = 4] = "Primitive";
  Types[Types["Promise"] = 5] = "Promise";
})(Types || (Types = {}));

function getType(value) {
  if (!value) return Types.Primitive;
  if (typeof value.then === 'function') return Types.Promise;
  if (isReadableStream(value)) return value._readableState.objectMode ? Types.ReadableObject : Types.ReadableString;
  if (Array.isArray(value)) return Types.Array;
  if (_typeof__default["default"](value) === 'object' || value instanceof Object) return Types.Object;
  return Types.Primitive;
}

var stackItemOpen = [];
stackItemOpen[Types.Array] = '[';
stackItemOpen[Types.Object] = '{';
stackItemOpen[Types.ReadableString] = '"';
stackItemOpen[Types.ReadableObject] = '[';
var stackItemEnd = [];
stackItemEnd[Types.Array] = ']';
stackItemEnd[Types.Object] = '}';
stackItemEnd[Types.ReadableString] = '"';
stackItemEnd[Types.ReadableObject] = ']';
var processFunctionLookupTable = ['processArray', 'processObject', 'processReadableString', 'processReadableObject', 'processPrimitive', 'processPromise'];
/*
for (const [key, val] of Object.entries(Types)) {
  if (typeof val === 'number') processFunctionLookupTable[val] = `process${key}`;
}
*/

function escapeString(string) {
  // Modified code, original code by Douglas Crockford
  // Original: https://github.com/douglascrockford/JSON-js/blob/master/json2.js
  // If the string contains no control characters, no quote characters, and no
  // backslash characters, then we can safely slap some quotes around it.
  // Otherwise we must also replace the offending characters with safe escape
  // sequences.
  return string.replace(rxEscapable, function (a) {
    var c = meta[a];
    return typeof c === 'string' ? c : "\\u".concat(a.charCodeAt(0).toString(16).padStart(4, '0'));
  });
}

function quoteString(string) {
  return "\"".concat(escapeString(string), "\"");
}

function readAsPromised(stream, size) {
  var value = stream.read(size);

  if (value === null) {
    return new Promise(function (resolve, reject) {
      var endListener = function endListener() {
        return resolve(null);
      };

      stream.once('end', endListener);
      stream.once('error', reject);
      stream.once('readable', function () {
        stream.removeListener('end', endListener);
        stream.removeListener('error', reject);
        resolve(stream.read());
      });
    });
  }

  return Promise.resolve(value);
}

function recursiveResolve(promise) {
  return promise.then(function (res) {
    return getType(res) === Types.Promise ? recursiveResolve(res) : res;
  });
}

var JsonStreamStringify = /*#__PURE__*/function (_Readable) {
  _inherits__default["default"](JsonStreamStringify, _Readable);

  var _super = _createSuper(JsonStreamStringify);

  function JsonStreamStringify(value, replacer, spaces) {
    var _this;

    var cycle = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    _classCallCheck__default["default"](this, JsonStreamStringify);

    _this = _super.call(this, {
      encoding: 'utf8'
    });

    _defineProperty__default["default"](_assertThisInitialized__default["default"](_this), "cycle", void 0);

    _defineProperty__default["default"](_assertThisInitialized__default["default"](_this), "visited", void 0);

    _defineProperty__default["default"](_assertThisInitialized__default["default"](_this), "stack", []);

    _defineProperty__default["default"](_assertThisInitialized__default["default"](_this), "replacerFunction", void 0);

    _defineProperty__default["default"](_assertThisInitialized__default["default"](_this), "replacerArray", void 0);

    _defineProperty__default["default"](_assertThisInitialized__default["default"](_this), "gap", void 0);

    _defineProperty__default["default"](_assertThisInitialized__default["default"](_this), "depth", 0);

    _defineProperty__default["default"](_assertThisInitialized__default["default"](_this), "error", void 0);

    _defineProperty__default["default"](_assertThisInitialized__default["default"](_this), "pushCalled", false);

    _defineProperty__default["default"](_assertThisInitialized__default["default"](_this), "end", false);

    _defineProperty__default["default"](_assertThisInitialized__default["default"](_this), "isReading", false);

    _defineProperty__default["default"](_assertThisInitialized__default["default"](_this), "readMore", false);

    _this.cycle = cycle;

    var spaceType = _typeof__default["default"](spaces);

    if (spaceType === 'string' || spaceType === 'number') {
      _this.gap = Number.isFinite(spaces) ? ' '.repeat(spaces) : spaces;
    }

    Object.assign(_assertThisInitialized__default["default"](_this), {
      visited: cycle ? new WeakMap() : new WeakSet(),
      replacerFunction: replacer instanceof Function && replacer,
      replacerArray: Array.isArray(replacer) && replacer
    });
    if (replacer instanceof Function) _this.replacerFunction = replacer;
    if (Array.isArray(replacer)) _this.replacerArray = replacer;

    _this.addToStack(value);

    return _this;
  }

  _createClass__default["default"](JsonStreamStringify, [{
    key: "cycler",
    value: function cycler(key, value) {
      var existingPath = this.visited.get(value);

      if (existingPath) {
        return {
          $ref: existingPath
        };
      }

      var path = this.path();
      if (key !== undefined) path.push(key);
      path = path.map(function (v) {
        return "[".concat(Number.isInteger(v) ? v : quoteString(v), "]");
      });
      this.visited.set(value, path.length ? "$".concat(path.join('')) : '$');
      return value;
    }
  }, {
    key: "addToStack",
    value: function addToStack(value, key, index, parent) {
      var _this2 = this;

      var realValue = value;

      if (this.replacerFunction) {
        realValue = this.replacerFunction(key || index, realValue, this);
      } // ORDER?


      if (realValue && realValue.toJSON instanceof Function) {
        realValue = realValue.toJSON();
      }

      if (realValue instanceof Function || _typeof__default["default"](value) === 'symbol') {
        realValue = undefined;
      }

      if (key !== undefined && this.replacerArray) {
        if (!this.replacerArray.includes(key)) {
          realValue = undefined;
        }
      }

      var type = getType(realValue);

      if ((parent && parent.type === Types.Array ? true : realValue !== undefined) && type !== Types.Promise) {
        if (parent && !parent.first) {
          this._push(',');
        } // eslint-disable-next-line no-param-reassign


        if (parent) parent.first = false;
      }

      if (realValue !== undefined && type !== Types.Promise && key !== undefined) {
        if (this.gap) {
          this._push("\n".concat(this.gap.repeat(this.depth), "\"").concat(escapeString(key), "\": "));
        } else {
          this._push("\"".concat(escapeString(key), "\":"));
        }
      }

      if (type !== Types.Primitive) {
        if (this.cycle) {
          // run cycler
          realValue = this.cycler(key || index, realValue);
          type = getType(realValue);
        } else {
          // check for circular structure
          if (this.visited.has(realValue)) {
            throw Object.assign(new Error('Converting circular structure to JSON'), {
              realValue: realValue,
              key: key || index
            });
          }

          this.visited.add(realValue);
        }
      }

      if (!key && index > -1 && this.depth && this.gap) this._push("\n".concat(this.gap.repeat(this.depth)));
      var open = stackItemOpen[type];
      if (open) this._push(open);
      var obj = {
        key: key,
        index: index,
        type: type,
        parent: parent,
        value: realValue,
        first: true
      };

      if (type === Types.Object) {
        this.depth += 1;
        obj.unread = Object.keys(realValue);
        obj.isEmpty = !obj.unread.length;
      } else if (type === Types.Array) {
        this.depth += 1;
        obj.unread = realValue.length;
        obj.arrayLength = obj.unread;
        obj.isEmpty = !obj.unread;
      } else if (type === Types.ReadableString || type === Types.ReadableObject) {
        var _realValue$_readableS, _realValue$_readableS2;

        this.depth += 1;

        if (realValue.readableEnded || (_realValue$_readableS = realValue._readableState) !== null && _realValue$_readableS !== void 0 && _realValue$_readableS.endEmitted) {
          this.emit('error', new Error('Readable Stream has ended before it was serialized. All stream data have been lost'), realValue, key || index);
        } else if (realValue.readableFlowing || (_realValue$_readableS2 = realValue._readableState) !== null && _realValue$_readableS2 !== void 0 && _realValue$_readableS2.flowing) {
          realValue.pause();
          this.emit('error', new Error('Readable Stream is in flowing mode, data may have been lost. Trying to pause stream.'), realValue, key || index);
        }

        obj.readCount = 0;
        realValue.once('end', function () {
          obj.end = true;

          _this2.__read();
        });
        realValue.once('error', function (err) {
          _this2.error = true;

          _this2.emit('error', err);
        });
      }

      this.stack.unshift(obj);
      return obj;
    }
  }, {
    key: "removeFromStack",
    value: function removeFromStack(item) {
      var type = item.type;
      var isObject = type === Types.Object || type === Types.Array || type === Types.ReadableString || type === Types.ReadableObject;

      if (type !== Types.Primitive) {
        if (!this.cycle) {
          this.visited["delete"](item.value);
        }

        if (isObject) {
          this.depth -= 1;
        }
      }

      var end = stackItemEnd[type];
      if (isObject && !item.isEmpty && this.gap) this._push("\n".concat(this.gap.repeat(this.depth)));
      if (end) this._push(end);
      var stackIndex = this.stack.indexOf(item);
      this.stack.splice(stackIndex, 1);
    } // tslint:disable-next-line:function-name

  }, {
    key: "_push",
    value: function _push(data) {
      this.pushCalled = true;
      this.push(data);
    }
  }, {
    key: "processReadableObject",
    value: function processReadableObject(current, size) {
      var _this3 = this;

      if (current.end) {
        this.removeFromStack(current);
        return undefined;
      }

      return readAsPromised(current.value, size).then(function (value) {
        if (value !== null) {
          if (!current.first) {
            _this3._push(',');
          } // eslint-disable-next-line no-param-reassign


          current.first = false;

          _this3.addToStack(value, undefined, current.readCount); // eslint-disable-next-line no-param-reassign


          current.readCount += 1;
        }
      });
    }
  }, {
    key: "processObject",
    value: function processObject(current) {
      // when no keys left, remove obj from stack
      if (!current.unread.length) {
        this.removeFromStack(current);
        return;
      }

      var key = current.unread.shift();
      var value = current.value[key];
      this.addToStack(value, key, undefined, current);
    }
  }, {
    key: "processArray",
    value: function processArray(current) {
      var key = current.unread;

      if (!key) {
        this.removeFromStack(current);
        return;
      }

      var index = current.arrayLength - key;
      var value = current.value[index]; // eslint-disable-next-line no-param-reassign

      current.unread -= 1;
      this.addToStack(value, undefined, index, current);
    }
  }, {
    key: "processPrimitive",
    value: function processPrimitive(current) {
      if (current.value !== undefined) {
        var type = _typeof__default["default"](current.value);

        var value;

        switch (type) {
          case 'string':
            value = quoteString(current.value);
            break;

          case 'number':
            value = Number.isFinite(current.value) ? String(current.value) : 'null';
            break;

          case 'bigint':
            value = String(current.value);
            break;

          case 'boolean':
            value = String(current.value);
            break;

          case 'object':
            if (!current.value) {
              value = 'null';
              break;
            }

          // eslint-disable-next-line no-fallthrough

          default:
            // This should never happen, I can't imagine a situation where this executes.
            // If you find a way, please open a ticket or PR
            throw Object.assign(new Error("Unknown type \"".concat(type, "\". Please file an issue!")), {
              value: current.value
            });
        }

        this._push(value);
      } else if (this.stack[1] && (this.stack[1].type === Types.Array || this.stack[1].type === Types.ReadableObject)) {
        this._push('null');
      } else {
        // eslint-disable-next-line no-param-reassign
        current.addSeparatorAfterEnd = false;
      }

      this.removeFromStack(current);
    }
  }, {
    key: "processReadableString",
    value: function processReadableString(current, size) {
      var _this4 = this;

      if (current.end) {
        this.removeFromStack(current);
        return undefined;
      }

      return readAsPromised(current.value, size).then(function (value) {
        if (value) _this4._push(escapeString(value.toString()));
      });
    }
  }, {
    key: "processPromise",
    value: function processPromise(current) {
      var _this5 = this;

      return recursiveResolve(current.value).then(function (value) {
        _this5.removeFromStack(current);

        _this5.addToStack(value, current.key, current.index, current.parent);
      });
    }
  }, {
    key: "processStackTopItem",
    value: function processStackTopItem(size) {
      var _this6 = this;

      var current = this.stack[0];
      if (!current || this.error) return Promise.resolve();
      var out;

      try {
        out = this[processFunctionLookupTable[current.type]](current, size);
      } catch (err) {
        return Promise.reject(err);
      }

      return Promise.resolve(out).then(function () {
        if (_this6.stack.length === 0) {
          _this6.end = true;

          _this6._push(null);
        }
      });
    } // tslint:disable-next-line:function-name

  }, {
    key: "__read",
    value: function __read(size) {
      var _this7 = this;

      if (this.isReading || this.error) {
        this.readMore = true;
        return undefined;
      }

      this.isReading = true; // we must continue to read while push has not been called

      this.readMore = false;
      return this.processStackTopItem(size).then(function () {
        var readAgain = !_this7.end && !_this7.error && (_this7.readMore || !_this7.pushCalled);

        if (readAgain) {
          setImmediate(function () {
            _this7.isReading = false;

            _this7.__read();
          });
        } else {
          _this7.isReading = false;
        }
      })["catch"](function (err) {
        _this7.error = true;

        _this7.emit('error', err);
      });
    } // tslint:disable-next-line:function-name

  }, {
    key: "_read",
    value: function _read(size) {
      this.pushCalled = false;

      this.__read(size);
    }
  }, {
    key: "path",
    value: function path() {
      return this.stack.map(function (_ref) {
        var key = _ref.key,
            index = _ref.index;
        return key || index;
      }).filter(function (v) {
        return v || v > -1;
      }).reverse();
    }
  }]);

  return JsonStreamStringify;
}(stream.Readable);

exports.JsonStreamStringify = JsonStreamStringify;
//# sourceMappingURL=polyfill.js.map
