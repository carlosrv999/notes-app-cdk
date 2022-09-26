const AWS = require('aws-sdk')
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

console.info("region:", AWS.config.region)

const secrets = new AWS.SecretsManager({})

exports.handler = async (e, context) => {
  console.info("la primera linea del handler")
  try {
    console.info("entro al bloque Try")
    const { config } = e.params
    console.info("paso const { config } = e.params")
    console.info("valor del config: ", config)
    const { password, username, host } = await getSecretValue(config.credsSecretName)
    console.info("paso const { password, username, host } = await getSecretValue(config.credsSecretName)")
    const connection = new Client({
      user: username,
      host: host,
      database: 'postgres',
      password: password,
      port: 5432,
    })
    console.info("se ha creado el objeto connection new Client");

    await connection.connect()
    console.info("luego de await connect()");

    const sqlScript = fs.readFileSync(path.join(__dirname, 'script.sql')).toString()
    console.info("Justo antes de hacer el query");
    const res = await connection.query(sqlScript)
    console.info("Justo despues de hacer el query");
    await connection.end();
    console.info("Justo despues de connection.end()");

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
  console.info("entro a la funcion de getSecretValue")
  return new Promise((resolve, reject) => {
    console.info("dentro del callback de return new promise")
    console.info("secretId:", secretId)
    secrets.getSecretValue({ SecretId: secretId }, (err, data) => {
      console.info("entro al callback!!")
      if (err) {
        console.info("ocurrio un error dentro de getSecretValue callback", err);
        return reject(err)
      }
      console.info("ha pasado el error, la data es JSON.parse(data.SecretString ):", data.SecretString)
      return resolve(JSON.parse(data.SecretString))
    })
  })
}
