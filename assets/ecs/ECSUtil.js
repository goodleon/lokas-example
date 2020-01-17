/**
 * 这是一个 常用函数集合,
 */
const Long = require('long');
const Buffer = require('buffer').Buffer;
const ObjectID = this ? require('bson').ObjectId : require('./binary/objectid');

let ECSUtil = {};

/**
 * 没太明白这个移除是咋玩的
 * @param arr
 * @param func
 */
ECSUtil.remove = function (arr, func) {
    for (let i = 0; i < arr.length; i++) {
        let value = arr[i];
        let isDel = func(value);
        if (isDel) {
            arr.splice(i, 1);
            i--;
        }
    }
};

/**
 * 判断两个数组或则对象是否相同
 * @param arrA
 * @param arrB
 * @returns {boolean}
 */
ECSUtil.isEqual = function (arrA, arrB) {
    if (!arrA || !arrB) {
        return false;
    }
    if (arrA.length !== arrB.length) {
        return false;
    }
    for (let i = 0, l = arrA.length; i < l; i++) {
        if (Array.isArray(arrA[i]) && Array.isArray(arrB[i])) {
            if (!utils.isEqual(arrA[i], arrB[i])) {
                return false;
            }
        } else if (arrA[i] != arrB[i]) {
            return false;
        }
    }
    return true;
};

/**
 *
 * @param val
 * @returns {boolean}
 */
ECSUtil.isObject = function (val) {
    return val != null && typeof val === 'object' && Array.isArray(val) === false && Object.prototype.toString.call(val) !== '[object Function]';
};
/**
 *
 * @param arg
 * @returns {boolean}
 */
ECSUtil.isArray = function (arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
};

/**
 *
 * @param arg
 * @returns {boolean}
 */
ECSUtil.isFunction = function (arg) {
    return Object.prototype.toString.call(arg) === '[object Function]';
};

/**
 *
 * @param arg
 * @returns {boolean}
 */
ECSUtil.isNumber = function (arg) {
    return typeof arg === 'number';
};

/**
 *
 * @param arg
 * @returns {boolean}
 */
ECSUtil.isString = function (arg) {
    return typeof arg === 'string';
};

/**
 * get component type[string, defineName, prototyp.__classname, getComponentName]
 * @param comp
 * @returns {*}
 */
ECSUtil.getComponentType = function (comp) {
    if (ECSUtil.isString(comp)) {
        return comp;
    }
    if (comp.defineName) {
        return comp.defineName();
    }
    if (comp.prototype) {
        return comp.prototype.__classname;
    }
    return comp.__proto__.getComponentName();
};

/**
 * clone
 * @param comp
 * @returns {function(): *}
 */
ECSUtil.clone = function (comp) {

    let ret = function () {
        return comp.apply(ret, arguments);
    };
    return ret;
};
/**
 * clone Func
 * @param ctor
 * @param superCtor
 */
ECSUtil.cloneFunc = function (ctor, superCtor) {
    for (let i in superCtor.prototype) {
        ctor.prototype[i] = superCtor.prototype[i];
    }
};
/**
 * 深度拷贝
 * @param obj
 * @returns {[]|Date|*}
 */
ECSUtil.cloneObjectDeep = function (obj) {
    if (null === obj || "object" !== typeof obj) return obj;

    if (obj instanceof Date) {
        let copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }
    if (obj instanceof Array | obj instanceof Object) {
        let copy = (obj instanceof Array) ? [] : {};
        for (let attr in obj) {
            if (obj.hasOwnProperty(attr))
                copy[attr] = ECSUtil.cloneObjectDeep(obj[attr]);
        }
        return copy;
    }
};

/**
 * obj包含key
 * @param obj
 * @param key
 * @returns {boolean}
 */
ECSUtil.has = function (obj, key) {
    return obj[key] !== undefined;
};

/**
 * 包含--->可以识别数组
 * @param collection
 * @param value
 * @returns {boolean}
 */
ECSUtil.includes = function (collection, value) {
    if (ECSUtil.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            if (collection.indexOf(value[i]) == -1) {
                return false;
            }
        }
    } else {
        if (collection.indexOf(value) == -1) {
            return false;
        }
        return collection.includes(value);
    }
    return true;
};
/**
 * 继承
 * @param ctor
 * @param superCtor
 */
ECSUtil.inherits = function (ctor, superCtor) {
    ctor._super = superCtor.prototype;
    for (let i in superCtor.prototype) {
        ctor.prototype[i] = superCtor.prototype[i];
    }
};


/**
 *
 * @param arg
 * @returns {boolean}
 */
ECSUtil.isBuffer = function (arg) {
    return arg instanceof Buffer || arg instanceof ArrayBuffer || arg instanceof Uint8Array;
};
/**
 *
 * @param arg
 * @returns {boolean}
 */
ECSUtil.isObjectID = function (arg) {
    return arg instanceof ObjectID;
};


/**
 *
 * @param arg
 * @returns {boolean}
 */
ECSUtil.isStringNumber = function (arg) {
    let regPos = /^\d+(\.\d+)?$/; //非负浮点数
    let regNeg = /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/; //负浮点数
    return regPos.test(arg) || regNeg.test(arg);
};
/**
 *
 * @param arg
 * @returns {boolean}
 */
ECSUtil.isLongString = function (arg) {
    if (!ECSUtil.isStringNumber(arg)) {
        return false;
    }
    return Long.fromString(arg).toString() === arg;
};
/**
 *
 * @param arg
 * @returns {*|boolean}
 */
ECSUtil.isFloat = function (arg) {
    return ECSUtil.isNumber(arg) && arg % 1 === 0;
};

/**
 *
 * @param arg
 * @returns {boolean}
 */
ECSUtil.isFloat = function (arg) {
    return ECSUtil.isDouble(arg) && (arg >= -3.4e+38 && arg <= 3.4e+38);
};
/**
 *
 * @param arg
 * @returns {*|boolean|boolean}
 */
ECSUtil.isByte = function (arg) {
    return ECSUtil.isLong(arg) && (arg >= -128 && arg <= 127);
};
/**
 *
 * @param arg
 * @returns {*|boolean|boolean}
 */
ECSUtil.isShort = function (arg) {
    return ECSUtil.isLong(arg) && (arg >= -32768 && arg <= 32767);
};
/**
 *
 * @param arg
 * @returns {*|boolean|boolean}
 */
ECSUtil.isInt = function (arg) {
    return ECSUtil.isLong(arg) && (arg >= -2147483648 && arg <= 2147483647);
};

/**
 *
 */
ECSUtil.LongNotInt = function (arg) {
    return ECSUtil.isLong(arg) && (arg < -2147483648 || arg > 2147483647);
};

/**
 *
 * @param arg
 * @returns {*|boolean}
 */
ECSUtil.isLong = function (arg) {
    return ECSUtil.isNumber(arg) && (!isNaN(arg)) && arg % 1 === 0;
};

/**
 *
 * @param arg
 * @returns {boolean}
 */
ECSUtil.isInteger = function (arg) {
    return arg % 1 === 0;
};


/**
 *
 * @param arg
 * @returns {boolean}
 */
ECSUtil.isDouble = function (arg) {
    return !ECSUtil.isInteger(arg) && (!isNaN(arg));
};

/**
 *
 * @param arg
 * @returns {boolean}
 */
ECSUtil.isBoolean = function (arg) {
    return typeof arg === 'boolean';
};

/**
 *
 * @param buf
 * @returns {boolean}
 */
ECSUtil.isGZip = function (buf) {
    if (!buf || buf.length < 3) {
        return false;
    }
    return buf[0] === 0x1F && buf[1] === 0x8B && buf[2] === 0x08;
};


module.exports = ECSUtil;

