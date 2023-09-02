import express from 'express';
import axios from 'axios';
import redis from 'redis';

const app = express();
const port = process.env.PORT || 5000;

let redisClient;

// fetch data from api
const fetchDataFromApi = async (characterId) => {
  let apiUrl = 'https://hp-api.onrender.com/api';
  if (characterId) {
    apiUrl = `${apiUrl}/character/${characterId}`
  } else {
    apiUrl = `${apiUrl}/characters`
  }
  const apiResponse = await axios.get(apiUrl);
  console.log("Request sent to the API");
  return apiResponse.data;
}

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

// fetch character by id
app.get("/hogwarts/characters/:id", cacheData, async (req, res) => {
  try {
    const redisKey = `hogwarts-character-${req.params.id}`;
    results = await fetchDataFromApi(req.params.id);
    if (!results.length) {
      throw new Error("Data unavailable");
    }
    await redisClient.set(redisKey, JSON.stringify(results), {
      EX: 120,  //EX: accepts a value with the cache duration in seconds.
      NX: true, //NX: when set to true, it ensures that the set() method should only set a key that doesn’t already exist in Redis.
    });

    return res.status(200).send({
      fromCache: false,
      data: results,
    });
  } catch (error) {
    console.log(error);
    res.status(404).send("Data unavailable");
  }
});

// fetch all characters
app.get("/hogwarts/characters", cacheData, async (req, res) => {
  
  let results;
  try {
    const redisKey = "hogwarts-characters";
    results = await fetchDataFromApi();
    if (!results.length) {
      throw new Error("Data unavailable");
    }
    await redisClient.set(redisKey, JSON.stringify(results), {
      EX: 120,
      NX: true,
    });

    return res.status(200).send({
      fromCache: false,
      data: results,
    });
  } catch (error) {
    console.log(error);
    res.status(404).send("Data unavailable");
  }
});

app.listen(port, () => {
  (async () => {
    redisClient = redis.createClient();
    redisClient.on("error", (error) => console.error(`Error : ${error}`));
    await redisClient.connect();
  })();
  if(redisClient){
    console.log("Redis connected");
  }
  console.log(`App listening on port ${port}`);
});