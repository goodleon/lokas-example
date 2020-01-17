const ECSUtil = require('../ECSUtil');
const nbt = require('../binary/nbt');
const Component = require('../Component');

class CmpVector extends Component {
    static defineName() {
        return 'CmpVector';
    }

    constructor(x, y, z) {
        super();
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
        this._angle = 0;
    }

    defineData() {
        return {
            x: 'Float',
            y: 'Float',
            z: 'Float',
        }
    }

    clone() {
        return new this.__proto__.constructor(this.x, this.y, this.z);
    }

    assgin(v) {
        this.x = v.x || this.x;
        this.y = v.y || this.y;
        this.z = v.z || this.z;
    }

    reverse(self) {
        let ret = self ? this : this.clone();
        ret.x = -ret.x;
        ret.y = -ret.y;
        ret.z = -ret.z;
        return ret;
    }

    equal(v) {
        return this.x === v.x && this.y === v.y && this.z === v.z;
    }

    add(pos, self) {
        let ret = self ? this : this.clone();
        ret.x += pos.x;
        ret.y += pos.y;
        ret.z += pos.z;
        return ret;
    }

    normalize(self) {
        let ret = self ? this : this.clone();
        let length = ret.length;
        ret = ret.divide(length, self);
        return ret;
    }

    minus(pos, self) {
        let ret = self ? this : this.clone();
        ret.x -= pos.x;
        ret.y -= pos.y;
        ret.z -= pos.z;
        return ret;
    }

    divide(v, self) {
        let ret = self ? this : this.clone();
        ret.x /= v;
        ret.y /= v;
        ret.z /= v;
        return ret;
    }

    multiply(v, self) {
        let ret = self ? this : this.clone();
        ret.x *= v;
        ret.y *= v;
        ret.z *= v;
        return ret;
    }

    floor(v, self) {
        let ret = self ? this : this.clone();
        ret.x = Math.floor(ret.x);
        ret.y = Math.floor(ret.y);
        ret.z = Math.floor(ret.z);
        return ret;
    }

    set length(length) {
        let angle;
        if (!this.x && !this.y) {
            angle = this._angle || 0;
        } else {
            angle = this.angle;
        }
        this.x = Math.cos(angle) * length;
        this.y = Math.sin(angle) * length;
    }

    get length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    }

    set angle(angle) {
        angle = angle * Math.PI / 180;
        this._angle = angle;
        const length = this.length;
        this.x = Math.cos(angle) * length;
        this.y = Math.sin(angle) * length;
    }

    get angle() {
        return this.getAngleByVector(this.x, this.y);
    }

    getAngleByVector(x, y) {
        if (y === 0) {
            if (x < 0) {
                return 270;
            } else if (x > 0) {
                return 90;
            }
            return 0;
        }
        if (x === 0) {
            if (y < 0) {
                return 180;
            } else if (y > 0) {
                return 0;
            }
        }
        let tan_yx = Math.abs(y) / Math.abs(x);
        let angle = 0;
        if (y > 0 && x < 0) {
            angle = 270 + Math.atan(tan_yx) * 180 / Math.PI;
        } else if (y > 0 && x > 0) {
            angle = 90 - Math.atan(tan_yx) * 180 / Math.PI;
        } else if (y < 0 && x < 0) {
            angle = 270 - Math.atan(tan_yx) * 180 / Math.PI;
        } else if (y < 0 && x > 0) {
            angle = 90 + Math.atan(tan_yx) * 180 / Math.PI;
        }
        return angle;
    }
}

/**
 * 坐标
 */
class CmpPosition extends CmpVector {
    static defineName() {
        return 'CmpPosition';
    }

    constructor(x, y, z) {
        super(x, y, z);
    }
}

/**
 * 运动 向量
 */
class CmpVelocity extends CmpVector {
    static defineName() {
        return 'CmpVelocity';
    }

    constructor(x, y, z) {
        super(x, y, z);
    }

    set speed(speed) {
        this.length = speed;
    }

    get speed() {
        return this.length;
    }
}

class CmpAccelation extends CmpVector {
    static defineName() {
        return 'CmpAccelation';
    }

    constructor(x, y, z) {
        super(x, y, z);
    }
}


let Rotation = function () {

};

let RotationSpeed = function () {

};

let RotationAccelation = function () {

};

class CmpSize extends Component {
    static defineName() {
        return 'CmpSize';
    }

    constructor(w = 0, h = 0) {
        super();
        this.w = w || 0;
        this.h = h || 0;
    }

    defineData() {
        return {
            w: 'Float',
            h: 'Float'
        }
    }
}


class CmpTimeStamp extends Component {
    static defineName() {
        return 'CmpTimeStamp';
    }

    constructor(time) {
        super();
        this.time = time;
    }

    defineData() {
        return {
            time: 'Float'
        }
    }
}


module.exports = {
    CmpAccelation: CmpAccelation,
    CmpPosition: CmpPosition,
    CmpVelocity: CmpVelocity,
    CmpVector: CmpVector,
    Rotation: Rotation,
    RotationSpeed: RotationSpeed,
    RotationAccelation: RotationAccelation,
    CmpSize: CmpSize,
    CmpTimeStamp: CmpTimeStamp
};

