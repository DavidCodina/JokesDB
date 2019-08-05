const deleteJoke = (e) => {
	let confirmation = confirm('Are you sure?');


	if (confirmation) {
		let id = e.target.getAttribute("data-id");
			fetch('/jokes/delete/'+id, { method: 'DELETE' })

			.then((res) => {
				return res.json();
			})

			.then((data) => {
				window.location.replace('/');
			});
	} else {
		return false;
	}
};


const deleteLinks = document.querySelectorAll(".deleteJoke");
deleteLinks.forEach((link) => {
	link.addEventListener('click', deleteJoke);
});
