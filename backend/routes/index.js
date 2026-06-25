const express = require('express');
const path = require('path');
const keys = require('./keys');
const customProviders = require('./customProviders');
const health = require('./health');
const models = require('./models');
const chat = require('./chat');
const manifest = require('./manifest');
const files = require('./files');
const endpoints = require('./endpoints');
const evolve = require('./evolve');
const { getProbes, postProbe } = require('./probes');

function mountRoutes(app) {
  app.use('/api/keys', keys);
  app.use('/api/custom-providers', customProviders);
  app.get('/api/custom-provider-presets', (req, res) => {
    // Re-export from customProviders module for convenience
    const { CUSTOM_PROVIDER_PRESETS } = require('../providers/presets');
    res.json(CUSTOM_PROVIDER_PRESETS);
  });
  app.use('/api/health', health);
  app.use('/api/models', models);
  app.get('/api/model-probes', getProbes);
  app.post('/api/models/probe', postProbe);
  app.use('/api/chat', chat);
  app.use('/api/manifest', manifest);
  app.use('/api/files', files);
  app.use('/api/endpoints', endpoints);
  app.use('/api/evolve', evolve);
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'index.html')));
}

module.exports = mountRoutes;
