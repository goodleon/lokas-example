const {CmpPosition, CmpVelocity, CmpAccelation} = require("./BaseComponents");
const CmpCircle = require('./CmpCircle');
const CmpPolygon = require('./CmpPolygon');

let MovingSystem = [
    function AccelSubSystem() {
        this.name = 'AccelSubSystem';
        this.components = [CmpVelocity, CmpAccelation];
        this.update = function (ent, dt) {
            let vel = ent.get(CmpVelocity);
            let acc = ent.get(CmpAccelation);
            vel.x += acc.x * dt / 1000;
            vel.y += acc.y * dt / 1000;
        };
    },
    function MoveSubSystem() {
        this.name = 'MoveSubSystem';
        this.components = [[CmpCircle, CmpPolygon, CmpPosition], CmpVelocity];
        this.update = function (ent, dt) {
            let cPolygon = ent.get('CmpPolygon');
            let cCircle = ent.get('CmpCircle');
            let cPosition = ent.get('CmpPosition');
            let cVelocity = ent.get('CmpVelocity');
            let pos = cPolygon || cCircle || cPosition;
            pos.x += cVelocity.x * dt / 1000;
            pos.y += cVelocity.y * dt / 1000;
        }
    },
];

let MovingModule = {
    name: 'MovingModule',
    onLoad: function (ecs) {
        ecs.registerComponent('CmpPosition', CmpPosition, 300, 10);
        ecs.registerComponent('CmpVelocity', CmpVelocity, 300, 10);
        ecs.registerComponent('CmpAccelation', CmpAccelation, 300, 10);
        ecs.registerComponent('CmpPolygon', CmpPolygon, 200, 10);
        ecs.registerComponent('CmpCircle', CmpCircle, 200, 10);
        ecs.registerSystem(MovingSystem);
    }
};

module.exports = {
    MovingSystem: MovingSystem,
    MovingModule: MovingModule
};
