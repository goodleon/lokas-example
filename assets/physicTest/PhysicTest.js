const CmpCircle = require('CmpCircle');
const CmpPolygon = require('CmpPolygon');
const CmpCollider = require('CmpCollider');
const CmpContact = require('CmpContact');
const CmpBVTree = require('CmpBVTree');
const CmpQuadTree = require('CmpQuadTree');
const Component = require('Component');
const {MovingSystem} = require('MovingSystem');
const {CmpPosition, CmpVelocity, CmpAccelation} = require("BaseComponents");
const Dice = require('Dice');

let width = 800;
let height = 800;

class CmpPhysicWorld extends Component {
    static defineName() {
        return 'CmpPhysicWorld'
    }

    constructor() {
        super();
        this.quadTree = new CmpQuadTree(0, 0, width, height);
        this.bvTree = new CmpBVTree();
        this.quad = false;
    }

    remove(collider, updating = false) {
        if (this.quad) {
            this.quadTree.remove(collider, updating)
        } else {
            this.bvTree.remove(collider, updating);
        }
    }

    insert(collider, updating = false) {
        if (this.quad) {
            this.quadTree.insert(collider, updating)
        } else {
            this.bvTree.insert(collider, updating);
        }
    }

    potentials(collider) {
        if (this.quad) {
            return this.quadTree.potentials(collider)
        } else {
            return this.bvTree.potentials(collider);
        }
    }

    draw(context) {
        if (this.quad) {
            this.quadTree.draw(context);
        } else {
            this.bvTree.draw(context);
        }
    }
}

class CmpCanvas extends Component {
    static defineName() {
        return 'CmpCanvas';
    }

    constructor() {
        super();
        this.size = 7;
        this.contexts = [];
        this.nodes = [];
    }

    onAdd() {
        for (let i = 0; i < this.size; i++) {
            let node = new cc.Node();
            let context = node.addComponent(cc.Graphics);
            cc.find('Canvas').addChild(node);
            this.nodes.push(node);
            this.contexts.push(context);

        }
    }

    onRemove(ent, ecs) {
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].removeFromParent(true);
        }
        this.nodes = [];
        this.contexts = [];
    }

    getContext(index) {
        return this.contexts[index];
    }

    clear() {
        for (let i = 0; i < this.contexts.length; i++) {
            this.contexts[i].clear();
        }
    }
}

let updateSystem = {
    name: 'updating',
    components: [CmpCollider, [CmpCircle, CmpPolygon]],
    update: function (ent, dt, now, ecs) {
        let cCollider = ent.get('CmpCollider');
        cCollider.updateBorder();
        let world = ecs.getSingleton(CmpPhysicWorld);
        world.remove(cCollider, true);
        world.insert(cCollider, true);
    }
};

let collisionSystem = {
    name: 'collision',
    enable: false,
    components: [CmpCollider, [CmpCircle, CmpPolygon], CmpVelocity],
    update: function (ent, dt, now, ecs) {
        let world = ecs.getSingleton(CmpPhysicWorld);
        let colliderA = ent.get('CmpCollider');
        let posA = ent.get('CmpPolygon') || ent.get('CmpCircle');
        let velA = ent.get('CmpVelocity') || ent.get('CmpVelocity');
        let result = new CmpContact();
        let potentials = world.potentials(ent);
        for (const colliderB of potentials) {
            if (colliderA.collide(colliderB, result)) {

                let posB = colliderB.getSibling('CmpPolygon') || colliderB.getSibling('CmpCircle');
                let velB = colliderB.getSibling('CmpVelocity') || colliderB.getSibling('CmpVelocity');
                posA.x -= result.overlap * result.overlap_x;
                posA.y -= result.overlap * result.overlap_y;

                let velAN = velA.normalize();
                let speed = velA.speed;

                let dot = velAN.x * result.overlap_y + velAN.y * -result.overlap_x;

                velAN.x = 2 * dot * result.overlap_y - velAN.x;
                velAN.y = 2 * dot * -result.overlap_x - velAN.y;
                velAN.normalize(true);
                velA.x = velAN.x * speed;
                velA.y = velAN.y * speed;

                if (velB) {
                    let velBN = velB.normalize();
                    speed = velB.speed;
                    dot = velBN.x * result.overlap_y + velBN.y * -result.overlap_x;
                    velBN.x = 2 * dot * result.overlap_y - velBN.x;
                    velBN.x = 2 * dot * -result.overlap_x - velBN.y;
                    velBN.normalize(true);
                    velB.x = velBN.x * speed;
                    velB.y = velBN.y * speed;
                }
            }
        }
    }
};

let shapeRendererSystem = {
    name: 'shapeRenderer',
    components: [[CmpCircle, CmpPolygon]],
    beforeUpdate: function (dt, now, ecs) {
        if (this.getSize() < 1200) {
            ecs.spawnEntity('CmpCircle', Dice.rng(-300, 300), Dice.rng(-300, 300), Dice.rng(3, 8), 1);
            ecs.spawnEntity('CmpPolygon', Dice.rng(-300, 300), Dice.rng(-300, 300), [[-4, -4], [4, -4], [4, 4], [-4, 4]], Dice.rng(0, 3), 1);
        }
        let cCanvas = ecs.getSingleton('CmpCanvas');
        cCanvas.clear();
    },
    update: (ent, dt, now, ecs) => {
        let cPolygon = ent.get('CmpPolygon');
        let cCircle = ent.get('CmpCircle');
        let cCanvas = ecs.getSingleton('CmpCanvas');
        let context = cCanvas.getContext(Dice.rngInt(0, 6));
        cPolygon && cPolygon.draw(context);
        cCircle && cCircle.draw(context);
    },
    afterUpdate: function (dt, now, ecs) {
        let cCanvas = ecs.getSingleton('CmpCanvas');
        for (let i = 0; i < 7; i++) {
            cCanvas.getContext(i).strokeColor = cc.Color.BLUE;
            cCanvas.getContext(i).stroke();
        }
    }
};

module.exports = {
    name: 'PhysicTest',
    onLoad: function (ecs) {
        ecs.registerComponent(CmpCircle);
        ecs.registerComponent(CmpPolygon);
        ecs.registerComponent(CmpCollider);
        ecs.registerSingleton(CmpCanvas);
        ecs.registerSingleton(CmpPhysicWorld);
        ecs.registerComponent(CmpPosition);
        ecs.registerComponent(CmpVelocity);
        ecs.registerComponent(CmpAccelation);
        ecs.registerSystem(MovingSystem);
        ecs.registerSystem(updateSystem);
        ecs.registerSystem(collisionSystem);
        ecs.registerSystem(shapeRendererSystem);

        ecs.setSpawner('CmpPolygon', function (ecs, x, y, points, rotation, scaleX, scaleY) {
            let ent = ecs.createEntity();
            ent.add(CmpPolygon, x, y, points, rotation, scaleX, scaleY);
            ent.add(CmpCollider);
            ecs.getSingleton(CmpPhysicWorld).insert(ent);
            return ent;
        });
        ecs.setSpawner('Polygon1', function (ecs, x, y, points, rotation, scaleX, scaleY) {
            let ent = ecs.createEntity();
            ent.add(CmpPolygon, x, y, points, rotation, scaleX, scaleY);
            ent.add(CmpCollider);
            ecs.getSingleton(CmpPhysicWorld).insert(ent);
            return ent;
        });

        ecs.setSpawner('CmpCircle', function (ecs, x, y, radius, scale) {
            let ent = ecs.createEntity();
            ent.add(CmpCircle, x, y, radius, scale);
            ent.add(CmpCollider);
            let speed = ent.add(CmpVelocity, 1, 1);
            speed.angle = Dice.rng(0, 360);
            speed.speed = Dice.rng(34, 60);
            ecs.getSingleton(CmpPhysicWorld).insert(ent);
            return ent;
        });
        ecs.spawnEntity('Polygon1', -width / 2, -height / 2, [[0, 0], [width, 0]]);
        ecs.spawnEntity('Polygon1', -width / 2, -height / 2, [[width, 0], [width, height]]);
        ecs.spawnEntity('Polygon1', -width / 2, -height / 2, [[width, height], [0, height]]);
        ecs.spawnEntity('Polygon1', -width / 2, -height / 2, [[0, height], [0, 0]]);
        console.log('wcx BATCH_VERTEX_COUNT = ' + cc.macro.BATCH_VERTEX_COUNT);
    }
};