/**
 * @fileoverview Export provider abstractions and default singleton instance.
 */

const BaseProvider = require('./BaseProvider');
const LocalProvider = require('./LocalProvider');
const defaultKnowledge = require('../../../data/research/curatedKnowledge.json');

const defaultProvider = new LocalProvider(defaultKnowledge);

module.exports = {
  BaseProvider,
  LocalProvider,
  defaultProvider,
};
