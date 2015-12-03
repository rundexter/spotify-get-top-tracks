var _ = require('lodash');
var SpotifyWebApi = require('spotify-web-api-node');

var globalPickResult = {
    'body.tracks': {
        key: 'body',
        fields: {
            name: 'Name',
            album: 'Album',
            artists: 'Artists',
            external_urls: 'URL',
            uri: 'URI'
        }
    }
};

var inputAttributes = ['workspace', 'name', 'notes'];

module.exports = {
    /**
     * Return pick result.
     *
     * @param output
     * @param pickResult
     * @returns {*}
     */
    pickResult: function (output, pickResult) {
        var result = {};

        _.map(_.keys(pickResult), function (resultVal) {

            if (_.has(output, resultVal)) {

                if (_.isObject(pickResult[resultVal])) {
                    if (_.isArray(_.get(output, resultVal))) {

                        if (!_.isArray(result[pickResult[resultVal].key])) {
                            result[pickResult[resultVal].key] = [];
                        }

                        _.map(_.get(output, resultVal), function (inOutArrayValue) {

                            result[pickResult[resultVal].key].push(this.pickResult(inOutArrayValue, pickResult[resultVal].fields));
                        }, this);
                    } else if (_.isObject(_.get(output, resultVal))){

                        result[pickResult[resultVal].key] = this.pickResult(_.get(output, resultVal), pickResult[resultVal].fields);
                    }
                } else {
                    _.set(result, pickResult[resultVal], _.get(output, resultVal));
                }
            }
        }, this);

        return result;
    },

    /**
     * Set acess token.
     *
     * @param dexter
     * @param spotifyApi
     */
    authParams: function (dexter, spotifyApi) {

        if (dexter.environment('spotify_access_token')) {

            spotifyApi.setAccessToken(dexter.environment('spotify_access_token'));
        }
    },

    /**
     * Set failure response.
     *
     * @param err
     * @param dexter
     */
    failureProcess: function (err, dexter) {

        var result = _.isArray(err)? err : [err];

        if (!dexter.environment('spotify_access_token')) {
            var envError = 'This module need optional environment variable [spotify_access_token];';

            result.unshift(envError);
        }

        return result;
    },

    /**
     * The main entry point for the Dexter module.
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {

        var spotifyApi = new SpotifyWebApi();

        this.authParams(dexter, spotifyApi);

        spotifyApi.getArtistTopTracks(step.input('id').first(), step.input('country').first())
            .then(function(data) {
                this.complete(this.pickResult(data, globalPickResult));
            }.bind(this), function(err) {

                this.fail(this.failureProcess(err, dexter));
            }.bind(this));
    }
};
