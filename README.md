# Node-Redis-Cache
It is a NodeJS app which is using Redis to demonstrate caching. It consumes [Harry Potter](https://hp-api.onrender.com/api/characters) API for the demo purpose.
A middleware function is used that stores the data in Redis using a key-value pair.


```
// cache data in redis
const cacheData = async (req, res, next) => {
  try {
    const characterId = req.params.id;
    let redisKey = "hogwarts-characters";
    if (characterId) {
      redisKey = `hogwarts-character-${req.params.id}`;
    }
    const cacheResults = await redisClient.get(redisKey);
    if (cacheResults) {
      res.send({
        fromCache: true,
        data: JSON.parse(cacheResults),
      });
    } else {
      next();
    }
  } catch (error) {
    console.error(error);
    res.status(404);
  }
}

```

## Response without caching
![image](https://github.com/Syed007Hassan/Node-Redis/assets/104893311/59a38a6f-8b68-4918-9f3d-d0efbb4a5d31)

**Response time: 566 ms**

## Response with caching
![image](https://github.com/Syed007Hassan/Node-Redis/assets/104893311/20af96c0-5f5e-474b-a933-1a53a8d5b88a)

**Response time: 17 ms**









