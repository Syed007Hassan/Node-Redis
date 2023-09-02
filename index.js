import express from 'express';
import axios from 'axios';
import redis from 'redis';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;


app.use(morgan('tiny'));
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());


let redisClient;

(async () => {
  redisClient = redis.createClient();
  redisClient.on("error", (error) => console.error(`Error : ${error}`));
  await redisClient.connect();
})();

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
    res.status(404).send("Data unavailable");
  }
}

app.get("/hogwarts/characters/:id", cacheData, async (req, res) => {
  try {
    const redisKey = `hogwarts-character-${req.params.id}`;
    const results = await fetchDataFromApi(req.params.id);
    if (!results.length) {
      throw new Error("Data unavailable");
    }
    await redisClient.set(redisKey, JSON.stringify(results), {
      EX: process.env.REDIS_EXPIRY_TIME,
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

app.get("/hogwarts/characters", cacheData, async (req, res) => {
  try {
    const redisKey = "hogwarts-characters";
    const results = await fetchDataFromApi();
    if (!results.length) {
      throw new Error("Data unavailable");
    }
    await redisClient.set(redisKey, JSON.stringify(results), {
      EX: process.env.REDIS_EXPIRY_TIME,
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


  if(redisClient){
    console.log("Connected to Redis");
  }
  console.log(`App listening on port ${port}`);
});