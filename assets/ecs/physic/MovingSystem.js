const {CmpPosition,CmpVelocity,CmpAccelation} = require("./BaseComponents");
const Circle = require('./Circle');
const Polygon = require('./Polygon');

let MovingSystem = [
    function AccelSubSystem() {
        this.name = 'AccelSubSystem';
        this.components = [CmpVelocity,CmpAccelation];
        this.update = function (ent,dt) {
            let vel = ent.get(CmpVelocity);
            let acc = ent.get(CmpAccelation);
            vel.x+=acc.x*dt/1000;
            vel.y+=acc.y*dt/1000;
        };
    },
    function MoveSubSystem() {
        this.name = 'MoveSubSystem';
        this.components = [[Circle,Polygon,CmpPosition],CmpVelocity];
        this.update = function (ent,dt) {
            let cPolygon = ent.get('Polygon');
            let cCircle = ent.get('Circle');
            let cPosition = ent.get('CmpPosition');
            let cVelocity = ent.get('CmpVelocity');
            let pos = cPolygon||cCircle||cPosition;
            pos.x+=cVelocity.x*dt/1000;
            pos.y+=cVelocity.y*dt/1000;
        }
    },
];

let MovingModule = {
    name:'MovingModule',
    onLoad:function (ecs) {
        ecs.registerComponent('CmpPosition',CmpPosition, 300, 10);
        ecs.registerComponent('CmpVelocity',CmpVelocity, 300, 10);
        ecs.registerComponent('CmpAccelation',CmpAccelation, 300, 10);
        ecs.registerComponent('Polygon',Polygon, 200, 10);
        ecs.registerComponent('Circle',Circle, 200, 10);
        ecs.registerSystem(MovingSystem);
    }
};

module.exports = {
    MovingSystem:MovingSystem,
    MovingModule:MovingModule
};
