const { Router } = require('express');
const { loadConfig } = require('../config');
const { discoverModels } = require('../services/modelDiscovery');

const router = Router();

router.get('/', async (req, res) => {
  const cfg = loadConfig();
  try {
    const models = await discoverModels(cfg);
    res.json(models);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
