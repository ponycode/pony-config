module.exports = function(grunt) {

    var fs = require('fs');
    var exec = require('child_process').exec;
    var path = require('path');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            // define the files to lint
            files: ['gruntfile.js', 'lib/**/*.js', 'index.js'],
            // configure JSHint (documented at http://www.jshint.com/docs/)
            options: {
                // more options here if you want to override JSHint defaults
                globals: {
                    console: true,
                    module: true
                }
            }
        },

		env : {
			options: {
				//Shared Options Hash
			},
			test: {
				PONYCONFIG_TRUE: 1,
				PONYCONFIG_FALSE: 0,
				PONYCONFIG_ENV: "ENVVAR_ENVIRONMENT"
				// PONYCONFIG_MISSING should be undefined
			},
		},

        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    captureFile: 'testResults.txt',
                },
                src: ['test/**/*.js']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-env');

    grunt.registerTask('test', ['env:test', 'mochaTest']);
    grunt.registerTask('default', ['jshint']);

};