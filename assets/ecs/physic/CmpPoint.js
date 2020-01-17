const CmpPolygon = require('./CmpPolygon');

class CmpPoint extends CmpPolygon {
    static defineName() {
        return 'CmpPoint';
    }

    constructor(x = 0, y = 0) {
        super(x, y, [[0, 0]], 0, 1, 1);
        this.x = x;
        this.y = y;
    }
}

module.exports = CmpPoint;