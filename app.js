const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();

const PORT = 8000;
const server = app.listen(PORT, () => console.log(`Server starts at PORT ${PORT}`));

const cookieMiddleware = cookieParser();

const io = require("socket.io")(server);

// use express built in body parser for now
app.use(express.urlencoded({extended: true}));

app.use(express.static("static"));

// use cookie at socket
io.use(function(socket, next) {
	cookieMiddleware(socket.request, {}, next);
});
app.use(cookieMiddleware);

// this has players property
// the player property has score and health property
let players = [];
const messages = [];
let enemies = [
		{x: 100, y: 5, type: 1},
		{x: 300, y: 5, type: 2},
		{x: 700, y: 5, type: 3},
		{x: 900, y: 10, type: 4},
		{x: 200, y: 10, type: 5},
		{x: 400, y: 10, type: 6},
		{x: 650, y: 10, type: 7},
		{x: 850, y: 5, type: 7},
		{x: 950, y: 15, type: 7},
		{x: 1020, y: 29, type: 7},
];
let bullets = [];
let timer = 0;

io.on("connection", socket => {

	const cookie = socket.request.cookies;

	// restart
	socket.on("restart", () => {
		players.forEach((a, id) => {
			players[id].score = 0;
			players[id].pos = {x: 1000/2, y: 617};
		});
		timer = 0;
	});
	
	// join the player
	socket.on("join", player => {
		const hero_number = Math.floor(Math.random() * 4 + 1);
		players.push({id: cookie["connect.sid"], hero_number,  name: player, pos: {x: 1000/2, y: 617}, score: 0});
		io.emit("players", players);
	});
	socket.on("players", () => {
		io.emit("players", players);
	});

	// get score board
	socket.on("scoreboard", () => {
		io.emit("scoreboard", players);	
	});

	// movements event
	socket.on("move_left", () => {
		players.forEach((player, index) => {
			if(player.id === cookie["connect.sid"]) {
				if(players[index].pos.x-10 < 0) return
				players[index].pos.x -= 10;
			}
		});
		io.emit("players", players);
	});
	socket.on("move_right", () => {
		players.forEach((player, index) => {
			if(player.id === cookie["connect.sid"]) {
				if(players[index].pos.x+10 > 1324) return
				players[index].pos.x += 10;
			}
		});
		io.emit("players", players);
	});
	socket.on("move_top", () => {
		players.forEach((player, index) => {
			if(player.id === cookie["connect.sid"]) {
				if(players[index].pos.y-10 < 0) return
				players[index].pos.y -= 10;
			}
		});
		io.emit("players", players);
	});
	socket.on("move_bottom", () => {
		players.forEach((player, index) => {
			if(player.id === cookie["connect.sid"]) {
				if(players[index].pos.y+10 > 617) return
				players[index].pos.y += 10;
			}
		});
		io.emit("players", players);
	});

	socket.on("fire_bullet", () => {
		players.forEach((player) => {
			if(player.id === cookie["connect.sid"]) {
				bullets.push({owner_id: player.id, x: player.pos.x, y: player.pos.y});
				io.emit("fire_bullet", bullets);
				return;
			}
		});
	});

	socket.on("move_bullets", () => {
		let new_bullets = [];
		bullets.forEach(bullet => {
			if(bullet.y > 0) {
				bullet.y -= 50;
				new_bullets.push(bullet);
			}
		});
		bullets = new_bullets;

		io.emit("fire_bullet", bullets);
	});

	// check if bullet hits an enemy
	socket.on("check_enemy_hit", () => {
		for(let i=0; i<bullets.length; i++) {
			for(let j=0; j<enemies.length; j++) {
				if(Math.abs(enemies[j].x - bullets[i].x) < 28 && Math.abs(enemies[j].y - bullets[i].y) < 28) {
					const index = players.findIndex(player => player.id == bullets[i].owner_id);
					players[index].score += 10;
					bullets.splice(i, 1);
					enemies[j].type = "-explode";
					setTimeout(() => {
						enemies[j].y = 0;
						enemies[j].type = Math.floor(Math.random() * 7 + 1);
						enemies[j].x = Math.floor(Math.random() * 1200 + 1);
					}, 2000);
					return;
				}
			}
		}
	});

	// check if hero collided with enemy
	socket.on("hero_collides_with_enemy", () => {
		for(let i=0; i<enemies.length; i++) {
			for(let j=0; j<players.length; j++) {
				if(Math.abs(players[j].pos.x - enemies[i].x) < 28 && Math.abs(players[j].pos.y - enemies[i].y) < 28) {
					players[j].score -= 10;
					return;
				}
			}
		}
	});

	// enemies
	socket.on("enemies", () => {
		io.emit("enemies", enemies);
	});
	socket.on("move_enemies", () => {
		let new_enemies = [];
		enemies.forEach(enemy => {
			if(enemy.y >= 617) {
				enemy.y = 0;
			}
			else {
				enemy.y += 15;
			}
			new_enemies.push(enemy);
		});
		enemies = new_enemies;

		io.emit("enemies", enemies);
	});

	// messages
	// push the message and broadcast to all
	socket.on("message", message => {
		players.forEach(player => {
			if(player.id === cookie["connect.sid"]) {
				messages.push({name: player.name, message: message.msg});
				socket.broadcast.emit("message", messages);
				return;
			}
		});
	});

	// listen for timer
	socket.on("timer", () => {
		// timer for 1:00
		timer++;
		io.emit("timer", timer);
	});

	socket.on("gameover", () => {
		io.emit("gameover", players);
	});

	// disconnect remove player 
	// socket.on("disconnect", () => {
	// 	console.log('disonnecting...')
	// 	if(players.length > 0) {
	// 		console.log(players);
	// 		players = players.map(player => {
	// 			if(player.id !== cookie["connect.sid"]) {
	// 				return player;
	// 			}
	// 		});
	// 		console.log(players);
	// 		socket.broadcast.emit("players", players);
	// 	}
	// });

});