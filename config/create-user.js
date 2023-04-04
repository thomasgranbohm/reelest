rs.initiate();

use admin;
db.createUser({ user: "admin", pwd: "password", roles: [{role: "root", db: "admin"}]});

use reelest;
db.createUser({
	user: "root",
	pwd: "example",
	roles: [{ role: "readWrite", db: "reelest" }],
});
