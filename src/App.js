

import './App.css';

import { useState, useRef } from 'react';
import { Curio } from './services/curioServices';


function App() {
	const [connected, setConnected] = useState(false);
	const [running, setRunning] = useState(false);
	const [curio, setCurio] = useState(null);
	const positionRef = useRef({ x: 0, y: 0, angle: 0 });
	const runningRef = useRef(false);
	const lastActionRef = useRef(null);

	const [speed, setSpeed] = useState(600);
	const [maxLR, setMaxLR] = useState(1000);
	const [stepDistance, setStepDistance] = useState(10);
	const [moveDuration, setMoveDuration] = useState(2000);

	const [areaWidth, setAreaWidth] = useState(100);
	const [areaHeight, setAreaHeight] = useState(100);

	const [robotWidth, setRobotWidth] = useState(13);
	const [robotLength, setRobotLength] = useState(14);

	const handleConnect = () => {
		const c = new Curio();
		c.connect(() => {
			console.log("Curio connected");
			setCurio(c);
			setConnected(true);
		});
	};

	const moveForward = () => {
		if (curio) {
			curio.setParameters({ left: maxLR, right: maxLR, speed });
			curio.move();
		}
	};

	const moveLeft = () => {
		if (curio) {
			curio.setParameters({ left: -maxLR, right: maxLR, speed });
			curio.move();
		}
	};

	const moveRight = () => {
		if (curio) {
			curio.setParameters({ left: maxLR, right: -maxLR, speed });
			curio.move();
		}
	};

	const stop = () => {
		if (curio) curio.stop();
	};

	const delay = ms => new Promise(res => setTimeout(res, ms));

	const rotateLeft = async () => {
		moveLeft();
		await delay(moveDuration);
		positionRef.current.angle = (positionRef.current.angle - 90 + 360) % 360;
		logPosition();
	};

	const rotateRight = async () => {
		moveRight();
		await delay(moveDuration);
		positionRef.current.angle = (positionRef.current.angle + 90) % 360;
		logPosition();
	};

	const moveForwardSafe = async () => {
		const pos = positionRef.current;
		const rad = (pos.angle * Math.PI) / 180;
		const dx = stepDistance * Math.cos(rad);
		const dy = stepDistance * Math.sin(rad);
		const newX = pos.x + dx;
		const newY = pos.y + dy;

		const marginX = robotWidth;
		const marginY = robotLength;

		if (
			newX > -areaWidth / 2 + marginX && 
			newX < areaWidth / 2 - marginX &&
			newY > -areaHeight / 2 + marginY && 
			newY < areaHeight / 2 - marginY
		) {
			moveForward();
			await delay(moveDuration);
			positionRef.current = { ...pos, x: newX, y: newY };
			logPosition();
		} else {
			await rotateLeft();
			lastActionRef.current = 'left';
		}
	};

	const resetPosition = () => {
		positionRef.current = { x: 0, y: 0, angle: 0 };
		console.log("Position reset to center.");
		logPosition();
	};

	const logPosition = () => {
		const { x, y, angle } = positionRef.current;
		console.log(`Position => x: ${x.toFixed(1)} cm, y: ${y.toFixed(1)} cm, angle: ${angle}°`);
	};

	const testMovement = async () => {
		if (!curio) return;

		console.log("AREA DIMENSIONS:", areaWidth, "x", areaHeight);
		console.log("STEP DISTANCE:", stepDistance);
		console.log("MOVE DURATION:", moveDuration);
		console.log("SPEED:", speed);
		console.log("MAX LR:", maxLR);

		resetPosition();

		await moveForwardSafe();
		await rotateLeft();
		await rotateRight();
		await moveForwardSafe();
	};

	const randomRunner = async () => {
		if (!curio) {
			console.log("Curio not connected, cannot start random runner");
			return;
		}
		while (runningRef.current) {
			const last = lastActionRef.current;
			const r = Math.random();
			let action = 'forward';

			if (r < 0.15 && last !== 'right') {
				action = 'left';
				await rotateLeft();
			} else if (r >= 0.15 && r < 0.30 && last !== 'left') {
				action = 'right';
				await rotateRight();
			} else {
				action = 'forward';
				await moveForwardSafe();
			}
			lastActionRef.current = action;
		}
	};

	const handleStartRunner = () => {
		setRunning(true);
		runningRef.current = true;
		randomRunner();
	};

	const handleStopRunner = () => {
		setRunning(false);
		runningRef.current = false;
		stop();
	};

	return (
		<div className="App">
		<header className="App-header">
			<h1>Curio Random Runner</h1>
				{!connected ? (
					<button onClick={handleConnect}>Connect</button>
				) : (
					<>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '20px auto' }}>
							<label>
								Area Width (cm):
								<input type="number" value={areaWidth} onChange={e => setAreaWidth(Number(e.target.value))} />
							</label>
							<label>
								Area Height (cm):
								<input type="number" value={areaHeight} onChange={e => setAreaHeight(Number(e.target.value))} />
							</label>
							<label>
								Robot Width (cm) (No need to touch):
								<input type="number" value={robotWidth} onChange={e => setRobotWidth(Number(e.target.value))} />
							</label>
							<label>
								Robot Length (cm) (No need to touch):
								<input type="number" value={robotLength} onChange={e => setRobotLength(Number(e.target.value))} />
							</label>
							<label>
								Steps (Should be around 1000, depends on the surface):
								<input type="number" value={maxLR} onChange={e => setMaxLR(Number(e.target.value))} />
							</label>
							<label>
								Step Distance (cm) (How far the robot moves with single forward movement, roughly Steps/100):
								<input type="number" value={stepDistance} onChange={e => setStepDistance(Number(e.target.value))} />
							</label>
							<label>
								Speed (0-600 is safe, max: 1000):
								<input type="number" value={speed} onChange={e => setSpeed(Number(e.target.value))} />
							</label>
							<label>
								Move Duration (ms) (How long each movement lasts):
								<input type="number" value={moveDuration} onChange={e => setMoveDuration(Number(e.target.value))} />
							</label>
						</div>
						<button onClick={handleStartRunner} disabled={running}>Start</button>
						<button onClick={handleStopRunner} disabled={!running}>Stop</button>
						<button onClick={resetPosition}>Reset Location</button>
						<button onClick={testMovement}>Test Movement</button>
					</>
				)}
		</header>
		</div>
	);
}

export default App;
