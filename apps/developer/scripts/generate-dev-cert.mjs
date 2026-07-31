/**
 * Generates localhost TLS certs for `next dev --experimental-https`.
 * Avoids mkcert -install (often fails on Windows without admin).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { X509Certificate } from "node:crypto"
import selfsigned from "selfsigned"

const __dirname = dirname(fileURLToPath(import.meta.url))
const certDir = join(__dirname, "..", "certificates")
const keyPath = join(certDir, "localhost-key.pem")
const certPath = join(certDir, "localhost.pem")

const HOSTS = ["localhost", "127.0.0.1", "::1"]

function certStillValid() {
  if (!existsSync(keyPath) || !existsSync(certPath)) return false

  try {
    const cert = new X509Certificate(readFileSync(certPath))
    const expires = new Date(cert.validTo).getTime()
    const minRemaining = 14 * 24 * 60 * 60 * 1000
    if (expires - Date.now() < minRemaining) return false
    return cert.checkHost("localhost")
  } catch {
    return false
  }
}

function generate() {
  mkdirSync(certDir, { recursive: true })

  const attrs = [{ name: "commonName", value: "localhost" }]
  const altNames = [
    { type: 2, value: "localhost" },
    { type: 7, ip: "127.0.0.1" },
    { type: 7, ip: "::1" },
  ]

  const pems = selfsigned.generate(attrs, {
    keySize: 2048,
    days: 825,
    algorithm: "sha256",
    extensions: [
      {
        name: "basicConstraints",
        cA: false,
      },
      {
        name: "keyUsage",
        digitalSignature: true,
        keyEncipherment: true,
      },
      {
        name: "extKeyUsage",
        serverAuth: true,
      },
      {
        name: "subjectAltName",
        altNames,
      },
    ],
  })

  writeFileSync(keyPath, pems.private, "utf8")
  writeFileSync(certPath, pems.cert, "utf8")

  console.log(`[dev-cert] wrote ${certPath}`)
  console.log(`[dev-cert] hosts: ${HOSTS.join(", ")}`)
  console.log(
    "[dev-cert] browser may warn once (self-signed). Open https://localhost:3004 and proceed.",
  )
}

if (certStillValid()) {
  console.log("[dev-cert] using existing certificate")
} else {
  generate()
}
