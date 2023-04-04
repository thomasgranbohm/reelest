# `📽️ reelest`

> Using Express.js, Prisma, MongoDB

## Setup

1.  Add root user to database:  
	`docker compose exec database mongosh reelest --eval 'db.createUser({ user: "root", pwd: "example", roles: [{role: "readWrite", db: "reelest" }]})'`