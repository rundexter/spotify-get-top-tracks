var _ = require('lodash'),
    util = require('./util.js'),
    SpotifyWebApi = require('spotify-web-api-node');

var pickInputs = {
        'id': {key: 'id', validate: { req: true } },
        'country': {key: 'country', validate: { req: true } },
        'public': { key: 'ids', type: 'boolean' }
    },
    pickOutputs = {
        'name': { key: 'body.tracks', fields: ['name'] },
        'album': { key: 'body.tracks', fields: ['album'] },
        'artists': { key: 'body.tracks', fields: ['artists'] },
        'external_urls': { key: 'body.tracks', fields: ['external_urls'] },
        'uri': { key: 'body.tracks', fields: ['uri'] }
    };

module.exports = {
    /**
     * The main entry point for the Dexter module.
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
        var spotifyApi = new SpotifyWebApi(),
            token = dexter.provider('spotify').credentials('access_token'),
            inputs = util.pickInputs(step, pickInputs),
            validateErrors = util.checkValidateErrors(inputs, pickInputs);

        if (validateErrors)
            return this.fail(validateErrors);

        spotifyApi.setAccessToken(token);
        spotifyApi.getArtistTopTracks(inputs.id, inputs.country)
            .then(function(data) {
                this.complete(util.pickOutputs(data, pickOutputs));
            }.bind(this), function(err) {
                this.fail(err);
            }.bind(this));
    }
};
