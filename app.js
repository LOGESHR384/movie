const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'moviesData.db')
const app = express()
app.use(express.json())

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

const convertMovieDbObjectToPascalCase = dbObject => {
  return {
    movieName: dbObject.movie_name,
  }
}

app.get(`/movies/`, async (request, response) => {
  const getAllMoviesQuery = `
  SELECT
  movie_name
  FROM 
  movie;`
  const movieArray = await database.all(getAllMoviesQuery)
  response.send(
    movieArray.map(moviename => convertMovieDbObjectToPascalCase(moviename)),
  )
})

app.post(`/movies/`, async (request, response) => {
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const addMovieQuery = `
  INSERT
  INTO
  movie( director_id, movie_name, lead_actor)
  VALUES(${directorId}, '${movieName}', '${leadActor}');`
  await database.run(addMovieQuery)
  response.send('Movie Successfully Added')
})

const convertDbObjectToResponseObject = dbObject => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  }
}

app.get(`/movies/:movieId/`, async (request, response) => {
  const {movieId} = request.params
  const getMoviesQuery = `
  SELECT 
  *
  FROM
  movie
  WHERE
  movie_id = ${movieId};`
  const movie = await database.get(getMoviesQuery)
  console.log(movieId)
  response.send(convertDbObjectToResponseObject(movie))
})

app.put(`/movies/:movieId/`, async (request, response) => {
  const {movieId} = request.params
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const updateMovieQuery = `
  UPDATE
  movie
  SET
  director_id = ${directorId},
  movie_name = '${movieName}',
  lead_actor = '${leadActor}'
  WHERE
  movie_id = ${movieId};`
  await database.run(updateMovieQuery)
  response.send('Movie Details Updated')
})

app.delete(`/movies/:movieId/`, async (request, response) => {
  const {movieId} = request.params
  const deleteMoviesQuery = `
  DELETE
  FROM
  movie
  WHERE
  movie_id = ${movieId};`
  await database.run(deleteMoviesQuery)
  response.send('Movie Removed')
})

const convertDirectorDbObjectToPascalCase = dbObject => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  }
}

app.get(`/directors/`, async (request, response) => {
  const getAllDirectorsQuery = `
  SELECT 
  *
  FROM
  director;`
  const directorsArray = await database.all(getAllDirectorsQuery)
  response.send(
    directorsArray.map(director =>
      convertDirectorDbObjectToPascalCase(director),
    ),
  )
})

const convertMovieNamePascalCase = dbObject => {
  return {
    movieName: dbObject.movie_name,
  }
}

app.get(`/directors/:directorId/movies/`, async (request, response) => {
  const {directorId} = request.params
  const getDirectorMovieQuery = `
  SELECT 
   movie_name
  FROM
  director INNER JOIN movie
  ON director.director_id = movie.director_id
  WHERE
  director.director_id = '${directorId}';`
  const movies = await database.all(getDirectorMovieQuery)
  response.send(
    movies.map(movienames => convertMovieNamePascalCase(movienames)),
  )
})

module.exports = app
