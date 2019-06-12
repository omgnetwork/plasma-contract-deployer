const express = require('express')
const bodyParser = require('body-parser')
const runner = require('./deploymentRunner')
const crypto = require('crypto')
require('log-timestamp')

const port = process.env.DEPLOYER_PORT || 3333

const app = express()
app.use(bodyParser.json())

app.post('/deploy', (req, res) => {
  req.body.deploy.id = req.body.deploy.id || randomId()
  console.log(`starting new deploy: ${JSON.stringify(req.body.deploy.id)}`)
  if (runner.start(req.body.deploy)) {
    res.send(req.body.deploy.id)
  } else {
    res.status(409)
    res.send('A deploy is already running')
  }
})

app.get('/deploy/:id/status', (req, res) => {
  try {
    runner.find(req.params.id)
  } catch (err) {
    res.status(404)
    res.send(err.toString())
    return
  }

  res.send(runner.status(req.params.id))
})

app.get('/deploy/:id/success', (req, res) => {
  try {
    runner.find(req.params.id)
  } catch (err) {
    res.status(404)
    res.send(err.toString())
    return
  }

  res.send(runner.success(req.params.id))
})

app.get('/deploy/:id/output', (req, res) => {
  try {
    runner.find(req.params.id)
  } catch (err) {
    res.status(404)
    res.send(err.toString())
    return
  }

  res.send(runner.output(req.params.id))
})

app.listen(port, () => console.log(`Deployer listening on port ${port}!`))

function randomId () {
  return crypto.randomBytes(16).toString('hex')
}
