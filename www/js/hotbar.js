import {Vector} from "./helpers.js";

export class Hotbar {

    constructor(hud, inventory) {
        let that                = this;
        this.hud                = hud;
        this.image              = new Image(); // new Image(40, 40); // Размер изображения
        //
        this.sounds = {
            hit3: new Howl({src: ['/sounds/hit3.ogg'], volume: .5})
        };
        //
        this.image.onload = function() {
            that.hud.add(that, 0);
        }
        this.image.src = './media/hotbar.png';
    }

    //
    setInventory(inventory) {
        this.inventory = inventory;
    }

    //
    damage(damage_value, reason_text) {
        if(damage_value > 0) {
            Game.player.server.ModifyIndicator('live', -damage_value, reason_text);
            console.log('Damage ' + damage_value + ', reason: ' + reason_text);
            this.sounds.hit3.play();
        }
    }

    setState(new_state) {
        for(const [key, value] of Object.entries(new_state)) {
            this[key] = value;
        }
    };
    
    drawHUD(hud) {
        const scale = 1;
        let w = 546; // this.image.width;
        let h = 147; // this.image.height;
        const cell_size = 60;
        let hud_pos = {
            x: hud.width / 2 - w / 2,
            y: hud.height - h
        };
        const ss = 27;
        // bar
        hud.ctx.drawImage(
            this.image,
            0,
            0,
            w,
            h,
            hud_pos.x,
            hud_pos.y,
            w,
            h
        );
        // Indicators
        let indicators = Game.player.indicators;
        let live = indicators.live.value / 20;
        let food = indicators.food.value / 20;
        // live
        for(let i = 0; i < Math.floor(live * 10); i++) {
            hud.ctx.drawImage(
                this.image,
                0,
                150,
                ss,
                ss,
                hud_pos.x + i * 24,
                hud_pos.y + 30,
                ss,
                ss
            );
        }
        if(Math.round(live * 10) > Math.floor(live * 10)) {
            hud.ctx.drawImage(
                this.image,
                0,
                150 + ss,
                ss,
                ss,
                hud_pos.x + Math.floor(live * 10) * 24,
                hud_pos.y + 30,
                ss,
                ss
            );
        }
        // foods
        for(let i = 0; i < Math.floor(food * 10); i++) {
            hud.ctx.drawImage(
                this.image,
                ss,
                150,
                ss,
                ss,
                hud_pos.x + w - (i * 24 + ss),
                hud_pos.y + 30,
                ss,
                ss
            );
        }
        if(Math.round(food * 10) > Math.floor(food * 10)) {
            hud.ctx.drawImage(
                this.image,
                ss,
                150 + ss,
                ss,
                ss,
                hud_pos.x + w - (Math.floor(food * 10) * 24 + ss),
                hud_pos.y + 30,
                ss,
                ss
            );
        }
        // inventory_selector
        hud.ctx.drawImage(
            this.image,
            81,
            150,
            72,
            69,
            hud_pos.x - 3 + this.inventory.index * cell_size,
            hud_pos.y + 48 + 30,
            72,
            69
        );
        if(this.inventory) {
            this.inventory.drawHotbar(hud, cell_size, new Vector(hud_pos.x, hud_pos.y + 48 + 30, 0));
        }
    }

}