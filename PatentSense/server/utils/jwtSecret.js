function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (typeof secret !== 'string' || secret.trim() !== secret || secret.length < 32 || new Set(secret).size < 10 || /replace-with|change-me|example-secret|patentsense-secret/i.test(secret)) {
    throw new Error('JWT_SECRET must be configured with a cryptographically random secret of at least 32 characters.');
  }
  return secret;
}

module.exports = getJwtSecret;
