import { IndexedColor, getChunkAddr, QUAD_FLAGS, Vector, VectorCollector } from '../../helpers.js';
import GeometryTerrain from "../../geometry_terrain.js";
import { BLEND_MODES } from '../../renders/BaseRenderer.js';
import { AABB } from '../../core/AABB.js';
import { Resources } from '../../resources.js';
import { CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z } from '../../chunk_const.js';

const TARGET_TEXTURES   = [.5, .5, 1, .25];
const RAIN_SPEED        = 1023; // 1023 pixels per second scroll . 1024 too much for our IndexedColor
const SNOW_SPEED        = 42;
const SNOW_SPEED_X      = 16;
const RAIN_RAD          = 8;
const RAIN_START_Y      = 128;
const RAIN_HEIGHT       = 128;

/**
 * Draw rain over player
 * @class Mesh_Object_Raindrop
 * @param {Renderer} gl Renderer
 * @param {Vector} pos Player position
 */
export default class Mesh_Object_Rain {

    #_enabled           = false;
    #_map               = new VectorCollector();
    #_player_block_pos  = new Vector();
    #_version           = 0;
    #_blocks_sets       = 0;

    constructor(render, type, chunkManager) {

        this.life           = 1;
        this.type           = type;
        this.chunkManager   = chunkManager;
        this.player         = render.player;

        // Material (rain)
        const mat = render.defaultShader.materials.doubleface_transparent;

        // Material
        this.material = mat.getSubMat(render.renderBackend.createTexture({
            source: Resources.weather[type],
            blendMode: BLEND_MODES.MULTIPLY,
            minFilter: 'nearest',
            magFilter: 'nearest'
        }));

    }

    /**
     * 
     * @param {AABB} aabb 
     * @param {*} c 
     * @returns 
     */
    createBuffer(c) {

        const snow      = this.type == 'snow';
        const vertices  = [];
        const lm        = new IndexedColor((snow ? SNOW_SPEED_X : 0), snow ? SNOW_SPEED : RAIN_SPEED, 0);
        const flags     = QUAD_FLAGS.FLAG_TEXTURE_SCROLL; // | QUAD_FLAGS.NO_CAN_TAKE_LIGHT;
        const pp        = lm.pack();

        let quads       = 0;

        if(this.buffer) {
            this.buffer.destroy();
        }

        this.pos = new Vector(this.player.lerpPos.x, RAIN_START_Y, this.player.lerpPos.z).flooredSelf();

        for(let [vec, height] of this.#_map.entries()) {
            const add = Math.random();
            height += add;
            const x = vec.x - this.pos.x + Math.random() / 10;
            const y = add + 1;
            const z = vec.z - this.pos.z + Math.random() / 10;
            const c2 = [...c];
            const uvSize0 = c[2];
            const uvSize1 = -height * c[3];
            // SOUTH
            vertices.push(
                x + 0.5, z + 0.5, y - height/2,
                1, 0, 0, 0, 1, height,
                c2[0], c2[1],
                uvSize0,
                uvSize1,
                pp, flags
            );
            // WEST
            vertices.push(
                x + 0.5, z + 0.5, y - height/2,
                0, -1, 0, 1, 0, height,
                c2[0], c2[1],
                uvSize0,
                uvSize1,
                pp, flags
            );
            quads += 2;
        }

        this.buffer = new GeometryTerrain(vertices);

        return quads;

    }

    //
    update(delta) {
    }

    /**
     * Draw particles
     * @param {Renderer} render Renderer
     * @param {float} delta Delta time from previous call
     * @memberOf Mesh_Object_Raindrop
     */
    draw(render, delta) {

        if(!this.enabled || !this.prepare() || !this.buffer) {
            return false;
        }

        render.renderBackend.drawMesh(this.buffer, this.material, this.pos);

    }

    /**
     * @returns {boolean}
     */
    prepare() {

        const player = this.player;

        if(this.#_player_block_pos.equal(player.blockPos)) {
            if(this.#_blocks_sets != this.chunkManager.block_sets) {
                this.#_blocks_sets = this.chunkManager.block_sets;
                this.updateHeightMap();
            }
        } else {
            this.#_player_block_pos.copyFrom(player.blockPos);
            this.#_map.clear();
            // update
            const vec = new Vector();
            for(let i = -RAIN_RAD; i <= RAIN_RAD; i++) {
                for(let j = - RAIN_RAD; j <= RAIN_RAD; j++) {
                    const dist = Math.sqrt(i * i + j * j);
                    if(dist < RAIN_RAD) {
                        vec.copyFrom(this.#_player_block_pos);
                        vec.addScalarSelf(i, -vec.y, j);
                        this.#_map.set(vec, 0);
                    }
                }
            }
            this.updateHeightMap();
        }

        return true;

    }

    angleTo(pos, target) {
        const angle = Math.atan2(target.x - pos.x, target.z - pos.z);
        return (angle > 0) ? angle : angle - 2 * Math.PI;
    }

    // Update height map
    updateHeightMap() {
        let checked_blocks = 0;
        let p = performance.now();
        const pos           = this.#_player_block_pos;
        const vec           = new Vector();
        const block_pos     = new Vector();
        const chunk_size    = new Vector(CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z);
        const chunk_addr    = new Vector();
        const chunk_addr_o  = new Vector(Infinity, Infinity, Infinity);
        let chunk           = null;
        let block           = null;
        let cx = 0, cy = 0, cz = 0, cw = 0;
        for(let i = -RAIN_RAD; i <= RAIN_RAD; i++) {
            for(let j = -RAIN_RAD; j <= RAIN_RAD; j++) {
                for(let k = 0; k < RAIN_HEIGHT; k++) {
                    vec.copyFrom(this.#_player_block_pos);
                    vec.addScalarSelf(i, -vec.y, j);
                    block_pos.set(pos.x + i, RAIN_START_Y - k, pos.z + j);
                    getChunkAddr(block_pos.x, block_pos.y, block_pos.z, chunk_addr);
                    if(!chunk_addr.equal(chunk_addr_o)) {
                        chunk = this.chunkManager.getChunk(chunk_addr);
                        chunk_addr_o.copyFrom(chunk_addr);
                        const dc = chunk.tblocks.dataChunk;
                        cx = dc.cx;
                        cy = dc.cy;
                        cz = dc.cz;
                        cw = dc.cw;
                    }
                    if(chunk && chunk.tblocks) {
                        chunk_addr.multiplyVecSelf(chunk_size);
                        block_pos.x -= chunk.coord.x;
                        block_pos.y -= chunk.coord.y;
                        block_pos.z -= chunk.coord.z;
                        const index = (block_pos.x * cx + block_pos.y * cy + block_pos.z * cz + cw);
                        const block_id = chunk.tblocks.id[index];
                        if(block_id > 0) {
                            block = chunk.tblocks.get(block_pos, block);
                            checked_blocks++;
                            if(block && (block.id > 0 || block.fluid > 0) && !block.material.invisible_for_rain) {
                                this.#_map.set(vec, k)
                                break;
                            }
                        }
                    }
                }
            }
        }
        p = performance.now() - p;
        const quads = this.createBuffer(TARGET_TEXTURES);
        // console.log('tm', checked_blocks, p, quads);
    }

    get enabled() {
        return this.#_enabled;
    }

    set enabled(value) {
        this.#_enabled = value;
    }

    /**
     * Destructor
     * @memberOf Mesh_Object_Raindrop
     */
    destroy(render) {
        if(this.buffer) {
            this.buffer.destroy();
        }
    }

    /**
     * Check particle status
     * @return {boolean}
     * @memberOf Mesh_Object_Raindrop
     */
    isAlive() {
        return this.enabled;
    }

}