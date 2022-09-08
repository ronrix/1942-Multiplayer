$(document).ready(() => {

	const socket = io.connect();
	
	socket.on("message", messages => {
		let msg = "";
		for(const message of messages) {
			if(name === message.name) {
				msg += `<p class="self"><span>you:</span> ${message.message}</p>`
			}
			else {
				msg += `<p class="other"><span>${message.name.toLowerCase()}:</span> ${message.message}</p>`
			}
		}

		$("div.chat-inner").html(msg);
		$("div.chat-outer").animate({ scrollTop: $("div.chat-inner")[0].offsetHeight}, 500);
	});

	$(document).on("submit", "form", e => {
		// sending msg
		socket.emit("message", {msg: $("input#msg").val()});

		$("div.chat-inner").append(`<p class="self"><span>you:</span> ${$("input#msg").val()}`);
		// empty the input
		$("input#msg").val("");

		$("div.chat-outer").animate({ scrollTop: $("div.chat-inner")[0].offsetHeight}, 500);
		e.preventDefault();
		return false;
	});

});