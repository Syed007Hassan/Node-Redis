import express from 'express';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 5000;


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

// fetch character by id
app.get("/hogwarts/characters/:id", async (req, res) => {
  try {
    const character = await fetchDataFromApi(req.params.id);
    if (!character.length) {
      throw new Error("Data unavailable");
    }
    return res.status(200).send({
      fromCache: false,
      data: character,
    });
  } catch (error) {
    console.log(error);
    res.status(404).send("Data unavailable");
  }
});

// fetch all characters
app.get("/hogwarts/characters", async (req, res) => {
  try {
    const characters = await fetchDataFromApi();
    if (!characters.length) {
      throw new Error("Data unavailable");
    }
    return res.status(200).send({
      fromCache: false,
      data: characters,
    });
  } catch (error) {
    console.log(error);
    res.status(404).send("Data unavailable");
  }
});


app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});