# `📽️ reelest`

> Using MENN stack

## Setup

Add root user to database

```
use reeler
db.createUser({ user: "root", pwd: "example": roles: [{role: "readWrite", db: "reeler" }]})
```