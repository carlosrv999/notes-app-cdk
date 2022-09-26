const AWS = require('aws-sdk')
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

console.info("region:", AWS.config.region)

const secrets = new AWS.SecretsManager({})

exports.handler = async (e, context) => {
  try {
    const { config } = e.params
    const { password, username, host } = await getSecretValue(config.credsSecretName)
    const connection = new Client({
      user: username,
      host: host,
      database: 'postgres',
      password: password,
      port: 5432,
    })

    await connection.connect()

    const sqlScript = fs.readFileSync(path.join(__dirname, 'script.sql')).toString()
    const res = await connection.query(sqlScript)
    await connection.end();

    return {
      status: 'OK',
      results: res
    }
  } catch (err) {
    console.info(err);
    return {
      status: 'ERROR',
      err,
      message: err.message
    }
  }
}

const getSecretValue = (secretId) => {
  return new Promise((resolve, reject) => {
    secrets.getSecretValue({ SecretId: secretId }, (err, data) => {
      if (err) {
        return reject(err)
      }
      return resolve(JSON.parse(data.SecretString))
    })
  })
}
