const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const app = express()
app.use(express.json())
const path = require('path')
const dbPath = path.join(__dirname, 'covid19IndiaPortal.db')
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()
app.get('/states/', async (request, response) => {
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401) // unauthorized
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'secretKey', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        const query = `SELECT * FROM state;`
        const states = await db.all(query)
        const convertDBObjectToResponseObject = dbObject => {
          return {
            stateId: dbObject.state_id,
            stateName: dbObject.state_name,
            population: dbObject.population,
          }
        }
        response.send(
          states.map(eachState => convertDBObjectToResponseObject(eachState)),
        )
      }
    })
  }
})
// Register User api
app.post('/users/', async (request, response) => {
  const {username, name, gender, password, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    // Create New User
    const createUserQuery = `
    INSERT INTO user(username, name, password, gender, location)
    VALUES(
      '${username}',
      '${name}',
      '${hashedPassword}',
      '${gender}',
      '${location}'
    );`
    await db.run(createUserQuery)
    response.send('User created Successfully')
  } else {
    // User already exists
    response.status(400)
    response.send('User Already exists')
  }
})

// Login User API
app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const query = `SELECT * FROM user WHERE username='${username}';`
  const dbUser = await db.get(query)
  if (dbUser === undefined) {
    // if username is wrong
    response.status(400)
    response.send('Invalid user')
  } // if valid username
  else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      // if valid password
      const payload = {username: username}
      const jwtToken = jwt.sign(payload, 'secretKey')
      response.send({jwtToken})
    } // if wrong password
    else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})
// API 3
app.get('/states/:stateId/', async (request, response) => {
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401) // unauthorized
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'secretKey', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        const {stateId} = request.params
        const stateQuery = `SELECT * FROM state WHERE state_id=${stateId};`
        const state = await db.get(stateQuery)
        const convertDBObjectToResponseObject = dbObject => {
          return {
            stateId: dbObject.state_id,
            stateName: dbObject.state_name,
            population: dbObject.population,
          }
        }
        response.send(convertDBObjectToResponseObject(state))
      }
    })
  }
})

// API 4
app.post('/districts/', async (request, response) => {
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401) // unauthorized
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'secretKey', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        const districtDetails = request.body
        const {districtName, stateId, cases, cured, active, deaths} =
          districtDetails
        const addDistrictQuery = `
          INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
          VALUES
          (
            '${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths}
          );`
        const newDistrict = await db.run(addDistrictQuery)
        response.send('District Successfully Added')
      }
    })
  }
})

// API 5
app.get('/districts/:districtId/', async (request, response) => {
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401) // unauthorized
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'secretKey', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        const {districtId} = request.params
        const districtQuery = `SELECT * FROM district WHERE district_id=${districtId};`
        const district = await db.get(districtQuery)
        const convertDBObjectToResponseObject = dbObject => {
          return {
            districtId: dbObject.district_id,
            districtName: dbObject.district_name,
            stateId: dbObject.state_id,
            cases: dbObject.cases,
            cured: dbObject.cured,
            active: dbObject.active,
            deaths: dbObject.deaths,
          }
        }
        response.send(convertDBObjectToResponseObject(district))
      }
    })
  }
})

// API 6
app.delete('/districts/:districtId/', async (request, response) => {
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401) // unauthorized
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'secretKey', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        const {districtId} = request.params
        const deleteDistrictQuery = `DELETE FROM district 
  WHERE district_id=${districtId};`
        await db.run(deleteDistrictQuery)
        response.send('District Removed')
      }
    })
  }
})

// API 7
app.put('/districts/:districtId/', async (request, response) => {
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401) // unauthorized
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'secretKey', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        const {districtId} = request.params
        const details = request.body
        const {districtName, stateId, cases, cured, active, deaths} = details
        const updateQuery = `
        UPDATE district SET
        district_name='${districtName}',
        state_id=${stateId},
        cases=${cases},
        cured=${cured},
        active=${active},
        deaths=${deaths};`
        await db.run(updateQuery)
        response.send('District Details Updated')
      }
    })
  }
})

// API 8
app.get('/states/:stateId/stats/', async (request, response) => {
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401) // unauthorized
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'secretKey', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        const {stateId} = request.params
        const query = `SELECT 
          SUM(case) AS case,
          SUM(cured) AS cured,
          SUM(active) AS active,
          SUM(deaths) AS deaths
          FROM district
          WHERE state_id = ${stateId};`
        const dbResponse = await db.get(query)
        const convertDBObjectToResponseObject = dbObject => {
          return {
            totalCases: dbObject.case,
            totalCured: dbObject.cured,
            totalActive: dbObject.active,
            totalDeaths: dbObject.deaths,
          }
        }
        response.send(convertDBObjectToResponseObject(dbResponse))
      }
    })
  }
})
module.exports = app
