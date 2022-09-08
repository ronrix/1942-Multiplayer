$(document).ready(() => {

	const socket = io.connect();
	
	class Hero {
		fireBullet() {
			socket.emit("fire_bullet");
			const firing_bullets = new Audio('../sounds/ow-sound-effect-2.mp3');
			firing_bullets.playBackRate = 0.1
			firing_bullets.play()
		}

		display() {
			socket.emit("players");
			socket.on("players", players => {
				let players_string = "";
				players.forEach(player => {
					players_string += `<div id='hero-${player.hero_number}' style="top: ${player.pos.y}px; left: ${player.pos.x}px"></div>`;
				});
				$("#players").html(players_string);
			});	
		}
	}

	const hero = new Hero();

	// displaying
	hero.display();

	// hero movement
	document.addEventListener('keydown', (e) => {
		switch(e.keyCode) {
			case 32: 
				if($("input#msg").is(":focus")) {
					break;
				}
				hero.fireBullet();
				break;
			case 37 || 67:  // LEFT
				socket.emit("move_left");
				break
			case 39 || 68:  // RIGHT
				socket.emit("move_right");
				break
			case 38 || 87:  // TOP
				socket.emit("move_top");
				break
			case 40 || 83: // BOTTOM
				socket.emit("move_bottom");
				break
		}

		hero.display();
	});

	socket.on("fire_bullet", bullets => {
		// displaying bullets
		let bulletString = ""
		for(const bullet of bullets) {
			bulletString += `<div class='bullet' style='top:${bullet.y-10}px; left:${bullet.x+5}px;'></div>`
		}
		document.getElementById('bullets').innerHTML = bulletString;
	});

	socket.emit("enemies");
	socket.on("enemies", enemies => {
		let enemiesString = ""
		// set the value for the position of enemies
		for(let i=0; i<enemies.length; i++) {
			enemiesString += `<div class='enemy${enemies[i].type}' style='top:${enemies[i].y}px; left:${enemies[i].x}px;'></div>`
		}

		document.getElementById('enemies').innerHTML = enemiesString
	});
	
	// for leaderboards
	socket.on("players", players => {
		let scoreboard_string = "";
		players.forEach(player => {
				scoreboard_string += `<li><div id="hero-${player.hero_number}"></div><p>${player.name}: <span id="score">${player.score}</span>pts</p></li>`;
		});
		$("#score-board ul").html(scoreboard_string);
	});

	let interval = setInterval(() => {
		socket.emit("move_bullets");
		socket.emit("move_enemies");
		socket.emit("check_enemy_hit");
		socket.emit("hero_collides_with_enemy");
		socket.emit("timer");
	}, 1000);

	// set timer for 1:00 for the gameover
	socket.on("timer", timer => {
		// 2 mins
		if(timer > 120) {
			socket.emit("gameover");
			return;
		}
		$("div.timer").text(timer);
	});


	// game over
	socket.on("gameover", players => {
		$("div.leaderboards").fadeIn();
		let html_string = "";
		for(const player of players) {
			html_string += `<li>${player.name}: ${player.score}pts</li>`;
		}
		$("div.leaderboards ul").html(html_string);
		sound.loop = false;
		clearInterval(interval);
	});
		
	$(document).on("click", "a#btn", (e) => {
		socket.emit("restart");
		$("div.leaderboards").fadeOut();
		window.location.reload();

		e.preventDefault();
		return false;
	});
});

