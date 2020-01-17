/**
 *
 */
class Component {
    static defineName() {
        return 'Component';
    }

    constructor() {
        this._entity = null;
    }

    defineData() {
        return {};
    }

    getComponentName() {
        return this.constructor.defineName();
    }

    /**
     * 获取当前 组件 的实体上面的同级组件
     * @param comp
     * @returns {*}
     */
    getSibling(comp) {
        if (this._entity) {
            return this._entity.get(comp);
        }
    }

    /**
     * 设置 当前组件的 实体
     * @param ent
     */
    setEntity(ent) {
        this._entity = ent;
    }

    getEntity() {
        return this._entity;
    }

    /**
     * 获得全局ECS对像
     * @returns {*}
     */
    getECS() {
        if (this._entity) {
            return this._entity.getECS();
        }
    }

    dirty() {
        this.onDirty(this._entity, this._entity._ecs);
        let renderer = this.getRenderer();
        if (renderer) {
            let renderComp = this.getSibling(renderer);
            renderComp && renderComp.dirty();
        }
        this.getECS().addRenderQueue(this);
        if (this._entity) {
            this._entity.markDirty(this);
        }
    }

    getRenderer() {
        return this.getECS().getComponentRenderer(this);
    }

    isRenderer() {
        return this.getECS().rendererArray.indexOf(this.getComponentName()) !== -1;
    };

    onAdd(ent, ecs) {

    }

    onRemove(ent, ecs) {

    }

    onDirty(ent, ecs) {

    }

    onCreate(ecs) {

    }

    onDestroy(ecs) {

    }

    onRegister(ecs) {

    }
}

module.exports = Component;