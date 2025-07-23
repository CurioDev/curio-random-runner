"use client";
import DeviceController from "@espruino-tools/core";

export class Curio extends DeviceController {
	constructor() {
        super();
		this.left = 0;
		this.right = 0;
		this.speed = 0;
    }

    move() {
        this.UART.write(`go(${this.right}, ${this.left}, ${this.speed})\n`);
    }

	stop() {
		this.UART.write(`go(0, 0)\n`);
	}

	setParameters(params) {
		if (params.left !== undefined) {
			this.left = params.left;
		}
		if (params.right !== undefined) {
			this.right = params.right;
		}
		if (params.speed !== undefined) {
			this.speed = params.speed;
		}

		console.log(`Setting parameters: left=${this.left}, right=${this.right}, speed=${this.speed}`);
	}
  
}