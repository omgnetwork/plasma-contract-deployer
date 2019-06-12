
const { spawn } = require('child_process')
const process = require('process')
const JobList = require('./fixedList')
require('log-timestamp')

const jobs = new JobList(5)

let isJobRunning = false

function start (deploy) {
  if (isJobRunning) {
    return false
  }

  isJobRunning = true
  launch(deploy)
  return true
}

async function launch (deploy) {
  const job = {
    id: deploy.id,
    status: 'Starting',
    stdout: '',
    stderr: ''
  }
  jobs.add(job)

  try {
    // Clean up after any previous job
    job.status = `Cleaning up previous job...`
    const args = ['-rf', 'plasma-contracts']
    await runJob(job, () => runCommand('rm', args, deploy.cwd))
  } catch (err) {
    isJobRunning = false
    job.status = `Error cleaning up: ${err.code} ${err.error}`
    return
  }

  try {
    // Clone the plasma-contracts repo
    job.status = `Cloning git repo...`
    await runJob(job, () => cloneRepo(deploy.tag, deploy.cwd))
  } catch (err) {
    isJobRunning = false
    job.status = `Error cloning github repo: ${err.code} ${err.error}`
    return
  }

  try {
    // Clone the plasma-contracts repo
    job.status = `Running npm install...`
    await runJob(job, () => runCommand('npm', ['i'], deploy.cwd + '/plasma-contracts'))
  } catch (err) {
    isJobRunning = false
    job.status = `Error running npm install: ${err.code} ${err.error}`
    return
  }

  try {
    // truffle migrate
    job.status = `Running truffle...`
    await runJob(job, () => truffleMigrate(deploy.args, deploy.cwd + '/plasma-contracts', deploy.env))
    job.status = `Exited`
  } catch (err) {
    job.status = `Error running truffle: ${err.code} ${err.error}`
  } finally {
    isJobRunning = false
  }
}

async function runJob (job, fn) {
  const result = await fn()
  job.code = result.code
  job.stdout += result.stdout
  job.stderr += result.stderr
  if (result.result) {
    job.result = result.result
  }
  if (job.code !== 0) {
    throw result
  }
}

function cloneRepo (tag, cwd) {
  const args = ['clone', 'https://github.com/omisego/plasma-contracts.git', '--depth', '1']
  if (tag) {
    args.push('--branch')
    args.push(tag)
  }
  return runCommand('git', args, cwd)
}

function truffleMigrate (args, cwd, env) {
  return runCommand('npx', ['truffle', ...args], cwd, env)
}

function runCommand (command, args, cwd, env) {
  console.log(`${command} ${args}`)
  if (env) {
    env = Object.assign(process.env, env)
  }

  const childProc = spawn(command, args, { cwd, env })
  const result = {
    stdout: '',
    stderr: ''
  }
  return new Promise((resolve, reject) => {
    childProc.stdout.on('data', (data) => {
      result.stdout += data
      if (data.includes('authority_addr')) {
        try {
          result.result = JSON.parse(data)
        } catch (err) {
          console.log(`Error parsing result ${data}: ${err}`)
        }
      }
      console.log(`stdout: ${data}`)
    })

    childProc.stderr.on('data', (data) => {
      result.stderr += data
      console.error(`stderr: ${data}`)
    })

    childProc.on('exit', (code) => {
      result.code = code
      console.log(`Exited: ${code}`)
      resolve(result)
    })

    childProc.on('error', (err) => {
      console.error(err)
      result.error = err
      reject(result)
    })
  })
}

function find (id) {
  const job = jobs.find(id)
  if (!job) {
    throw new Error(`No job with id ${id}`)
  }
  return job
}

function status (id) {
  const job = find(id)
  return job.status
}

function success (id) {
  const job = find(id)
  return job.code === 0
}

function output (id) {
  const job = find(id)
  return {
    stdout: job.stdout,
    stderr: job.stderr,
    result: job.result
  }
}

module.exports = { start, find, status, success, output }
