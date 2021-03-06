/**
 * 碰撞机
 * @type {CmpRect}
 */
const CmpRect = require('./CmpRect');
const CmpContact = require('./CmpContact');
const Collision = require('./Collision');

class CmpCollider extends CmpRect {
    static defineName() {
        return 'CmpCollider';
    }

    constructor(minX = 0, minY = 0, maxX = 0, maxY = 0, padding = 0) {
        super(minX, minY, maxX, maxY);
        this.padding = padding;
        this.minX = 0;
        this.maxX = 0;
        this.minY = 0;
        this.maxY = 0;
        this.tag = 0;
        this.quadTree = null;   //所在的四叉树节点
        this.quadWorld = null;  //所在的四叉树世界
        this.parent = null;     //层次包围盒父节点
        this.world = null;      //层次包围盒世界节点
        this.contacts = [];
        this.collideCount = 0;
    }

    addContact(entity, contact) {
        if (this.contacts[entity.id]) {
            return;
        }
        this.contacts[entity.id] = contact;
        let cod = entity.get(CmpCollider);
        cod.contacts[this.entity.id] = contact;
        cod.collideCount++;
        this.collideCount++;
    }

    removeAllContacts() {
        for (let i in this.contacts) {
            this.removeContact(i);
        }
    }

    checkIsCollidable(a, b, world) {
        if (!a || !b) {
            return false;
        }
        if (!a.tag && !b.tag) {
            return true;
        }
        return world.config[a.tag] ? world.config[a.tag][b.tag] : false;
    }

    createContact(ecs, A, B) {
        let contact = this.isContact(A, B);
        if (contact) {
            contact.get(CmpContact).dispatchStayEvent();
            return;
        }
        let codA = A.get(CmpCollider);


        let cent = ecs.createEntity();
        contact = cent.add(CmpContact, A, B);
        codA.addContact(B, cent);
        contact.dispatchEnterEvent();
    }

    isContact(A, B, world) {
        return A.get(CmpCollider).contacts[B.id];
    }

    deleteContactfunction(A, B) {
        let contact = this.isContact(A, B);
        if (!contact) {
            return;
        }
        contact.get(CmpContact).dispatchExitEvent();
        let codA = A.get(CmpCollider);
        codA.removeContact(B);
    }

    getFirstContact() {
        for (let i in this.contacts) {
            if (this.contacts[i]) {
                return this.contacts[i];
            }
        }
    }

    getFirstCollider() {
        let contact = this.getFirstContact();
        if (!contact) return;
        contact = contact.get('CmpContact');
        if (!contact) return;
        return contact.getCollider(this.entity);
    }

    removeContact(id) {
        let contact = this.contacts[id];
        if (contact) {
            this.collideCount--;
            contact.destroy();
            let ent = this.getEntity();
            let cod = contact.get('CmpContact').getCollider(ent).get('CmpCollider');
            cod.collideCount--;
            delete cod.contacts[ent.id];
            delete this.contacts[id];
        }
    }

    setTag() {
        return this.tag;
    }

    collide(collider, result = null, aabb = true) {
        return Collision(this, collider, result, aabb);
    }

    onRemove(ent, ecs) {
        if (this.world) {
            this.world.remove(this);
        }
    }

    updateBorder() {
        let cPolygon = this.getSibling('CmpPolygon') || this.getSibling('CmpPoint');
        let cCircle = this.getSibling('CmpCircle');
        cPolygon && cPolygon._calculateCoords();
        this.minX = cPolygon ? cPolygon.minX : cCircle.x - cCircle.radius * cCircle.scale - this.padding;
        this.maxX = cPolygon ? cPolygon.maxX : cCircle.x + cCircle.radius * cCircle.scale + this.padding;
        this.minY = cPolygon ? cPolygon.minY : cCircle.y - cCircle.radius * cCircle.scale - this.padding;
        this.maxY = cPolygon ? cPolygon.maxY : cCircle.y + cCircle.radius * cCircle.scale + this.padding;
    }

    draw(context) {
        const min_x = this.minX;
        const min_y = this.minY;
        const max_x = this.maxX;
        const max_y = this.maxY;

        context.moveTo(min_x, min_y);
        context.lineTo(max_x, min_y);
        context.lineTo(max_x, max_y);
        context.lineTo(min_x, max_y);
        context.lineTo(min_x, min_y);
        context.close();
    }
}

module.exports = CmpCollider;